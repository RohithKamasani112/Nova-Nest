import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createLeadStatus, listLeadStatuses, LeadStatusOption } from '../../../services/crmApi';
import { STATUS_LABELS, STATUS_OPTIONS } from './crmVisuals';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const ADD_NEW = '__add_status__';
const STATUS_EVENT = 'crm-status-options-changed';
let cached: LeadStatusOption[] | null = null;
let pending: Promise<LeadStatusOption[]> | null = null;

export function useLeadStatuses() {
  const [options, setOptions] = useState<LeadStatusOption[]>(cached ?? STATUS_OPTIONS.map(value => ({ value, label: STATUS_LABELS[value] })));
  useEffect(() => {
    let active = true;
    const sync = () => { if (active && cached) setOptions(cached); };
    const refresh = () => {
      if (!pending) pending = listLeadStatuses().then(result => { cached = result; return result; }).finally(() => { pending = null; });
      pending.then(sync).catch(() => {});
    };
    window.addEventListener(STATUS_EVENT, sync);
    window.addEventListener('focus', refresh);
    refresh();
    return () => { active = false; window.removeEventListener(STATUS_EVENT, sync); window.removeEventListener('focus', refresh); };
  }, []);
  return options;
}

export async function saveStatusOption(label: string) {
  const option = await createLeadStatus(label);
  cached = [...(cached ?? STATUS_OPTIONS.map(value => ({ value, label: STATUS_LABELS[value] }))).filter(item => item.value !== option.value), option];
  window.dispatchEvent(new Event(STATUS_EVENT));
  return option;
}

export function LeadStatusSelect({ value, onValueChange, disabled, className, label = 'Lead status' }: {
  value: string; onValueChange: (value: string) => void | Promise<void>; disabled?: boolean; className?: string; label?: string;
}) {
  const options = useLeadStatuses();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const selected = options.find(option => option.value === value);
  return <>
    <Select value={value} disabled={disabled} onValueChange={next => {
      if (next === ADD_NEW) { setName(''); setAdding(true); } else void onValueChange(next);
    }}>
      <SelectTrigger aria-label={label} className={className ?? 'w-full'}><SelectValue>{selected?.label ?? STATUS_LABELS[value] ?? value}</SelectValue></SelectTrigger>
      <SelectContent onClick={event => event.stopPropagation()}>
        {!selected && <SelectItem value={value}>{STATUS_LABELS[value] ?? value}</SelectItem>}
        {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
        <SelectItem value={ADD_NEW} className="font-semibold text-primary">+ Add new status</SelectItem>
      </SelectContent>
    </Select>
    <Dialog open={adding} onOpenChange={open => { if (!saving) setAdding(open); }}>
      <DialogContent onClick={event => event.stopPropagation()}>
        <DialogHeader><DialogTitle>Add new status</DialogTitle><DialogDescription>Save a status your team can select again for other leads.</DialogDescription></DialogHeader>
        <form className="space-y-4" onSubmit={async event => {
          event.preventDefault();
          if (!name.trim() || saving) return;
          setSaving(true);
          try {
            const option = await saveStatusOption(name.trim());
            setAdding(false);
            await onValueChange(option.value);
          } catch { toast.error('Could not save status. Please try again.'); }
          finally { setSaving(false); }
        }}>
          <label className="block space-y-2 text-sm font-medium">Status name<Input autoFocus maxLength={60} required value={name} disabled={saving} onChange={event => setName(event.target.value)} placeholder="e.g. Customer requested evening call" /></label>
          <div className="flex gap-2"><Button type="submit" disabled={saving || !name.trim()}>{saving ? 'Saving...' : 'Add & select'}</Button><Button type="button" variant="outline" disabled={saving} onClick={() => setAdding(false)}>Cancel</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}
