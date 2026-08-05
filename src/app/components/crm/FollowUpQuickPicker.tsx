import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface FollowUpQuickPickerProps {
  onPick: (iso: string) => void;
  onCancel?: () => void;
}

const QUICK_OPTIONS: { label: string; days: number }[] = [
  { label: 'Tomorrow', days: 1 },
  { label: '+2 days', days: 2 },
  { label: '+1 week', days: 7 },
  { label: '+2 weeks', days: 14 },
];

// Default reminder time for quick-pick options — a specific date with no
// time would otherwise default to midnight, which reads oddly as "due at
// 12am."
const DEFAULT_HOUR = 10;

export const FollowUpQuickPicker: React.FC<FollowUpQuickPickerProps> = ({ onPick, onCancel }) => {
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const pickDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(DEFAULT_HOUR, 0, 0, 0);
    onPick(d.toISOString());
  };

  const handleCustomSubmit = () => {
    if (!customValue) return;
    onPick(new Date(customValue).toISOString());
    setCustomOpen(false);
    setCustomValue('');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {QUICK_OPTIONS.map((opt) => (
          <Button key={opt.label} type="button" variant="outline" size="sm" onClick={() => pickDays(opt.days)}>
            {opt.label}
          </Button>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setCustomOpen((v) => !v)}>
          Custom
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
      {customOpen && (
        <div className="flex items-center gap-2">
          <Input
            type="datetime-local"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="w-56"
          />
          <Button type="button" size="sm" onClick={handleCustomSubmit} disabled={!customValue}>
            Set
          </Button>
        </div>
      )}
    </div>
  );
};
