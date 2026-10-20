import { useState } from 'react';
import toast from 'react-hot-toast';
import { CALL_OUTCOMES } from './crmVisuals';
import { saveStatusOption, useLeadStatuses } from './LeadStatusSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export function CallOutcomePicker({ onLog }: { onLog: (label: string, scheduleFollowUp: boolean) => Promise<void> }) {
  const statuses = useLeadStatuses();
  const [value, setValue] = useState('');
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const labels = [...new Set([...CALL_OUTCOMES.map(option => option.label), ...statuses.filter(option => option.value.startsWith('custom_')).map(option => option.label)])];
  return <div className="space-y-2">
    <label className="block text-sm font-semibold">Log call outcome</label>
    <Select value={value} onValueChange={setValue} disabled={busy}>
      <SelectTrigger aria-label="Call outcome" className="w-full"><SelectValue placeholder="Select what happened on the call" /></SelectTrigger>
      <SelectContent>
        {labels.map(label => <SelectItem key={label} value={label}>{label}</SelectItem>)}
        <SelectItem value="__custom__">+ Add custom outcome</SelectItem>
      </SelectContent>
    </Select>
    {value === '__custom__' && <Input aria-label="Custom call outcome" maxLength={60} placeholder="Enter your call outcome" value={custom} onChange={event => setCustom(event.target.value)} disabled={busy} />}
    <Button type="button" size="sm" variant="outline" disabled={busy || !value || (value === '__custom__' && !custom.trim())} onClick={async () => {
      setBusy(true);
      try {
        const label = value === '__custom__' ? (await saveStatusOption(custom.trim())).label : value;
        await onLog(label, CALL_OUTCOMES.find(option => option.label === label)?.scheduleFollowUp ?? false);
        setValue(''); setCustom('');
      } catch { toast.error('Could not save call outcome. Please try again.'); }
      finally { setBusy(false); }
    }}>{busy ? 'Saving...' : value === '__custom__' ? 'Add & log outcome' : 'Log outcome'}</Button>
  </div>;
}
