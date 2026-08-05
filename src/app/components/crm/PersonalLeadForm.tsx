import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { AlertTriangle } from 'lucide-react';
import { checkDuplicateLead, createPersonalLead, listAgents } from '../../../services/crmApi';
import { CrmAgent, PersonalLeadInput } from '../../../types/crm';

interface PersonalLeadFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const SOURCE_DETAIL_OPTIONS = ['Walk-in', 'Referral', 'Instagram', 'Facebook', 'Website', 'Call'];

const emptyForm = (): PersonalLeadInput => ({
  name: '',
  phone: '',
  altPhone: '',
  email: '',
  agentId: null,
  leadDate: new Date().toISOString().slice(0, 10),
  sourceDetail: 'Walk-in',
  listingType: '',
  propertyType: '',
  configuration: '',
  priceMin: null,
  priceMax: null,
  city: '',
  locality: '',
  project: '',
  notes: '',
  nextFollowUpAt: '',
  status: 'new',
});

export const PersonalLeadForm: React.FC<PersonalLeadFormProps> = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState<PersonalLeadInput>(emptyForm());
  const [agents, setAgents] = useState<CrmAgent[]>([]);
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState<{ id: string; name: string; source: string; created_at: string } | null>(null);
  const [overrideDuplicate, setOverrideDuplicate] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setDuplicate(null);
      setOverrideDuplicate(false);
      listAgents().then(setAgents).catch(() => setAgents([]));
    }
  }, [open]);

  const set = <K extends keyof PersonalLeadInput>(key: K, value: PersonalLeadInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhoneBlur = async () => {
    if (!form.phone || form.phone.trim().length < 10) return;
    try {
      const match = await checkDuplicateLead(form.phone);
      setDuplicate(match);
    } catch {
      // non-fatal — duplicate check is a convenience, not a hard gate
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error('Name is required.');
    if (!form.phone.trim()) return toast.error('Phone is required.');
    if (!form.agentId) return toast.error('Please assign an agent.');
    if (duplicate && !overrideDuplicate) {
      return toast.error('This number already exists. Check the box to add anyway, or cancel.');
    }

    setSaving(true);
    try {
      await createPersonalLead({
        ...form,
        email: form.email || null,
        overrideDuplicateReason: duplicate && overrideDuplicate ? 'Confirmed distinct lead by admin' : null,
      });
      toast.success('Lead added.');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Could not save this lead.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Personal Lead</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block">Name *</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Phone *</Label>
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} onBlur={handlePhoneBlur} />
            {duplicate && (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <div>
                  <p>
                    ⚠ This number already exists — {duplicate.name}, {duplicate.source}, added{' '}
                    {new Date(duplicate.created_at).toLocaleDateString()}
                  </p>
                  <label className="mt-1 flex items-center gap-1.5">
                    <input type="checkbox" checked={overrideDuplicate} onChange={(e) => setOverrideDuplicate(e.target.checked)} />
                    Add anyway — this is a different person
                  </label>
                </div>
              </div>
            )}
          </div>
          <div>
            <Label className="mb-1.5 block">Alt phone</Label>
            <Input value={form.altPhone ?? ''} onChange={(e) => set('altPhone', e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Email</Label>
            <Input value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
          </div>

          <div>
            <Label className="mb-1.5 block">Agent *</Label>
            <Select value={form.agentId ?? ''} onValueChange={(v) => set('agentId', v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Lead date</Label>
            <Input type="date" value={form.leadDate ?? ''} onChange={(e) => set('leadDate', e.target.value)} />
          </div>

          <div>
            <Label className="mb-1.5 block">Source detail</Label>
            <Select value={form.sourceDetail ?? ''} onValueChange={(v) => set('sourceDetail', v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_DETAIL_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Listing type</Label>
            <Select value={form.listingType ?? ''} onValueChange={(v) => set('listingType', v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {['rent', 'sale', 'resale', 'pg', 'commercial', 'other'].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block">Property type</Label>
            <Input value={form.propertyType ?? ''} onChange={(e) => set('propertyType', e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">BHK / Configuration</Label>
            <Input value={form.configuration ?? ''} onChange={(e) => set('configuration', e.target.value)} />
          </div>

          <div>
            <Label className="mb-1.5 block">Budget min</Label>
            <Input type="number" value={form.priceMin ?? ''} onChange={(e) => set('priceMin', e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Budget max</Label>
            <Input type="number" value={form.priceMax ?? ''} onChange={(e) => set('priceMax', e.target.value ? Number(e.target.value) : null)} />
          </div>

          <div>
            <Label className="mb-1.5 block">City</Label>
            <Input value={form.city ?? ''} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Locality</Label>
            <Input value={form.locality ?? ''} onChange={(e) => set('locality', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Project</Label>
            <Input value={form.project ?? ''} onChange={(e) => set('project', e.target.value)} />
          </div>

          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Requirement notes</Label>
            <Textarea value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={3} />
          </div>

          <div>
            <Label className="mb-1.5 block">Next follow-up</Label>
            <Input type="date" value={form.nextFollowUpAt ?? ''} onChange={(e) => set('nextFollowUpAt', e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Add Lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
