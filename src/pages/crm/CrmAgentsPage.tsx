import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, Pencil, UserX, UserCheck } from 'lucide-react';
import { Button } from '../../app/components/ui/button';
import { Badge } from '../../app/components/ui/badge';
import { Checkbox } from '../../app/components/ui/checkbox';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../app/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../app/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../app/components/ui/dialog';
import { AgentFormDialog } from '../../app/components/crm/AgentFormDialog';
import { deactivateAgent, listAgentsWithStats, updateAgent } from '../../services/crmApi';
import { AgentStats } from '../../types/crm';

interface ReassignPromptState {
  agent: AgentStats;
  openLeadsCount: number;
}

export const CrmAgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentStats | null>(null);
  const [reassignPrompt, setReassignPrompt] = useState<ReassignPromptState | null>(null);
  const [reassignTarget, setReassignTarget] = useState<string>('__unassigned__');

  const load = () => {
    setLoading(true);
    listAgentsWithStats(showInactive)
      .then(setAgents)
      .catch(() => toast.error('Could not load agents.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  const openCreate = () => {
    setEditingAgent(null);
    setFormOpen(true);
  };

  const openEdit = (agent: AgentStats) => {
    setEditingAgent(agent);
    setFormOpen(true);
  };

  const handleReactivate = async (agent: AgentStats) => {
    try {
      await updateAgent(agent.id, { isActive: true });
      toast.success(`${agent.name} reactivated.`);
      load();
    } catch {
      toast.error('Could not reactivate agent.');
    }
  };

  const attemptDeactivate = async (agent: AgentStats, opts: { reassignToAgentId?: string | null; leaveUnassigned?: boolean } = {}) => {
    try {
      await deactivateAgent(agent.id, opts);
      toast.success(`${agent.name} deactivated.`);
      setReassignPrompt(null);
      load();
    } catch (err: any) {
      const data = err?.response?.data;
      if (err?.response?.status === 409 && data?.error === 'NEEDS_REASSIGNMENT') {
        setReassignPrompt({ agent, openLeadsCount: data.openLeadsCount });
        setReassignTarget('__unassigned__');
        return;
      }
      toast.error(data?.error ?? 'Could not deactivate agent.');
    }
  };

  const confirmReassignAndDeactivate = () => {
    if (!reassignPrompt) return;
    const opts =
      reassignTarget === '__unassigned__'
        ? { leaveUnassigned: true }
        : { reassignToAgentId: reassignTarget };
    attemptDeactivate(reassignPrompt.agent, opts);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Agents</h2>
          <p className="text-sm text-muted-foreground">Manage who leads get assigned to.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Checkbox checked={showInactive} onCheckedChange={(v) => setShowInactive(!!v)} />
            Show inactive
          </label>
          <Button onClick={openCreate}>
            <UserPlus size={16} /> Add Agent
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Total Leads</TableHead>
              <TableHead>Converted</TableHead>
              <TableHead>Conv. %</TableHead>
              <TableHead>Overdue Follow-ups</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={10} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : agents.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="py-10 text-center text-muted-foreground">No agents yet.</TableCell></TableRow>
            ) : (
              agents.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.email ?? '—'}</TableCell>
                  <TableCell>{a.phone ?? '—'}</TableCell>
                  <TableCell>
                    {a.is_active ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                  </TableCell>
                  <TableCell>{a.total_leads}</TableCell>
                  <TableCell>{a.converted}</TableCell>
                  <TableCell>{a.conversion_rate}%</TableCell>
                  <TableCell>
                    {a.overdue_follow_ups > 0 ? <span className="font-medium text-red-600">{a.overdue_follow_ups}</span> : '0'}
                  </TableCell>
                  <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      <Button variant="outline" size="icon" className="h-7 w-7" title="Edit" onClick={() => openEdit(a)}>
                        <Pencil size={13} />
                      </Button>
                      {a.is_active ? (
                        <Button variant="outline" size="icon" className="h-7 w-7" title="Deactivate" onClick={() => attemptDeactivate(a)}>
                          <UserX size={13} />
                        </Button>
                      ) : (
                        <Button variant="outline" size="icon" className="h-7 w-7" title="Reactivate" onClick={() => handleReactivate(a)}>
                          <UserCheck size={13} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AgentFormDialog open={formOpen} onClose={() => setFormOpen(false)} agent={editingAgent} onSaved={load} />

      <Dialog open={!!reassignPrompt} onOpenChange={(v) => !v && setReassignPrompt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign open leads</DialogTitle>
          </DialogHeader>
          {reassignPrompt && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {reassignPrompt.agent.name} has {reassignPrompt.openLeadsCount} open lead
                {reassignPrompt.openLeadsCount === 1 ? '' : 's'}. Reassign them to…
              </p>
              <Select value={reassignTarget} onValueChange={setReassignTarget}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unassigned__">Leave unassigned</SelectItem>
                  {agents.filter((a) => a.is_active && a.id !== reassignPrompt.agent.id).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignPrompt(null)}>Cancel</Button>
            <Button onClick={confirmReassignAndDeactivate}>Reassign & deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
