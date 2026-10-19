import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, Pencil, Plus, ShieldCheck } from 'lucide-react';
import { crmApi, listAgents } from '../services/crmApi';
import { CrmAgent } from '../types/crm';
import { Button } from '../app/components/ui/button';
import { LEAD_SOURCE_OPTIONS, leadSourceLabels, selectedLeadSources } from '../utils/leadSources';

interface TeamAccount {
  id: string; username: string; name: string; role: 'telecaller' | 'agent';
  source_scope: string[]; is_active: boolean; agent_id: string | null; agent_name: string | null;
}
interface AccountForm {
  id?: string; username: string; name: string; password: string; role: 'telecaller' | 'agent';
  portals: string[]; agentId: string; isActive: boolean;
}
const emptyForm: AccountForm = { username: '', name: '', password: '', role: 'telecaller', portals: ['magicbricks'], agentId: '', isActive: true };
const fieldClass = 'mt-1 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-base sm:text-sm';
const accountScope = (account: TeamAccount) => account.role === 'agent' ? `Assigned leads · ${account.agent_name ?? 'Unlinked'}` : leadSourceLabels(account.source_scope);

export const TeamAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<TeamAccount[]>([]);
  const [members, setMembers] = useState<CrmAgent[]>([]);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const load = async () => {
    setLoading(true); setLoadError(false);
    try {
      const [response, agents] = await Promise.all([crmApi.get<{ accounts: TeamAccount[] }>('/team-accounts'), listAgents()]);
      setAccounts(response.data.accounts); setMembers(agents);
    } catch { setLoadError(true); toast.error('Could not load team logins.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const edit = (account: TeamAccount) => setForm({ id: account.id, username: account.username, name: account.name, password: '', role: account.role,
    portals: selectedLeadSources(account.source_scope),
    agentId: account.agent_id ?? '', isActive: account.is_active });
  const selectMember = (agentId: string) => {
    const existing = accounts.find(account => account.role === 'agent' && account.agent_id === agentId);
    if (existing) {
      edit(existing);
      return;
    }
    setForm({ ...form, agentId });
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.role === 'telecaller' && !form.portals.length) { toast.error('Choose at least one lead source.'); return; }
    setSaving(true);
    try {
      await crmApi.put('/team-accounts', { ...form, password: form.password || undefined,
        portals: form.role === 'telecaller' ? form.portals : undefined, agentId: form.role === 'agent' ? form.agentId : undefined });
      toast.success('Team login saved. Updated accounts must sign in again.');
      setForm(emptyForm); await load();
    } catch (error: any) { toast.error(error?.response?.data?.error ?? 'Could not save login.'); }
    finally { setSaving(false); }
  };
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div><p className="crm-eyebrow mb-2">ADMINISTRATION</p><h1 className="text-3xl font-semibold text-gray-900">Team logins</h1>
        <p className="mt-2 text-sm text-gray-600">Create usernames, reset passwords and control CRM access. All accounts use the same login page.</p></div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.1fr]">
        <form onSubmit={save} className="space-y-4 rounded-2xl border bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 font-semibold"><KeyRound size={18} />{form.id ? 'Edit login' : 'Create login'}</h2>
            {form.id && <Button type="button" variant="ghost" onClick={() => setForm(emptyForm)}><Plus size={14} />New</Button>}</div>
          <label className="block text-sm font-medium">Display name<input required maxLength={200} className={fieldClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label className="block text-sm font-medium">Username<input required autoCapitalize="none" autoComplete="off" pattern="[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}" className={fieldClass} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="e.g. housing.calls" /></label>
          <label className="block text-sm font-medium">{form.id ? 'New password (leave blank to keep current)' : 'Password'}<input type="password" autoComplete="new-password" required={!form.id} minLength={8} maxLength={128} className={fieldClass} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
          <label className="block text-sm font-medium">Role<select className={fieldClass} value={form.role} onChange={e => setForm({ ...form, role: e.target.value as AccountForm['role'] })}><option value="telecaller">Telecaller</option><option value="agent">Team member</option></select></label>
          {form.role === 'telecaller' ? <fieldset className="space-y-2"><legend className="mb-2 text-sm font-medium">Lead access — select one or more</legend>
            {LEAD_SOURCE_OPTIONS.map(option => {
              const owners = accounts.filter(account => account.role === 'telecaller' && account.id !== form.id && option.sources.some(source => account.source_scope.includes(source)));
              return <label key={option.value} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                <input type="checkbox" className="mt-0.5" checked={form.portals.includes(option.value)} onChange={e => setForm({ ...form, portals: e.target.checked ? [...form.portals, option.value] : form.portals.filter(portal => portal !== option.value) })} />
                <span><span className="font-medium">{option.label}</span>{owners.length > 0 && <span className="mt-1 block text-xs text-gray-500">Selecting transfers all existing and new leads from {owners.map(owner => owner.name).join(', ')}.</span>}</span>
              </label>;
            })}
            <p className="text-xs text-gray-500">Custom includes website and manually entered leads. Saving transfers selected sources and their full lead history to this login. Previous telecallers keep their other sources.</p>
          </fieldset>
            : <label className="block text-sm font-medium">Linked team member<select required className={fieldClass} value={form.agentId} onChange={e => selectMember(e.target.value)}><option value="">Select a team member</option>{members.map(member => {
              const existing = accounts.find(account => account.role === 'agent' && account.agent_id === member.id);
              return <option key={member.id} value={member.id}>{member.name}{existing ? ' (login exists)' : ''}</option>;
            })}</select><span className="mt-1 block text-xs font-normal text-gray-500">Select any team member. Members with a login open their existing account for editing. This login sees leads assigned to that member.</span></label>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />Login enabled</label>
          <Button type="submit" disabled={saving || loading || loadError} className="w-full">{saving ? 'Saving…' : 'Save login'}</Button>
        </form>
        <section className="space-y-3"><h2 className="flex items-center gap-2 font-semibold"><ShieldCheck size={18} />Access directory</h2>
          {loading ? <p className="p-6 text-sm text-gray-500">Loading logins…</p> : loadError ? <Button variant="outline" onClick={() => void load()}>Retry loading logins</Button> : accounts.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-sm text-gray-500">No scoped logins yet. Create telecaller and individual team accounts here.</p> : accounts.map(account => (
            <article key={account.id} className="flex items-start justify-between gap-3 rounded-xl border bg-white p-4">
              <div className="min-w-0"><p className="truncate font-semibold">{account.name}</p><p className="break-all text-sm text-gray-600">{account.username}</p><p className="mt-1 text-xs text-gray-500">{accountScope(account)}</p><span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${account.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{account.is_active ? 'Active' : 'Disabled'}</span></div>
              <Button type="button" variant="outline" size="icon" aria-label={`Edit ${account.name} login`} onClick={() => edit(account)}><Pencil size={15} /></Button>
            </article>))}
        </section>
      </div>
    </div>
  );
};
