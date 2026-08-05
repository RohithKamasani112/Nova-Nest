import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { createAgent, updateAgent } from '../../../services/crmApi';
import { CrmAgent } from '../../../types/crm';

interface AgentFormDialogProps {
  open: boolean;
  onClose: () => void;
  agent?: CrmAgent | null;
  onSaved: (agent: CrmAgent) => void;
}

export const AgentFormDialog: React.FC<AgentFormDialogProps> = ({ open, onClose, agent, onSaved }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(agent?.name ?? '');
    setEmail(agent?.email ?? '');
    setPhone(agent?.phone ?? '');
    setIsActive(agent?.is_active ?? true);
  }, [open, agent]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required.');
      return;
    }
    setSaving(true);
    try {
      const saved = agent
        ? await updateAgent(agent.id, { name: name.trim(), email: email.trim() || null, phone: phone.trim() || null, isActive })
        : await createAgent({ name: name.trim(), email: email.trim() || null, phone: phone.trim() || null });
      toast.success(agent ? 'Agent updated.' : 'Agent added.');
      onSaved(saved);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Could not save agent.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{agent ? 'Edit agent' : 'Add agent'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="agent@example.com" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" />
          </div>
          {agent && (
            <div className="flex items-center justify-between rounded-lg border p-2">
              <span className="text-sm">Active</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
