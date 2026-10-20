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
    <div className="crm-quick-date-picker space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        {QUICK_OPTIONS.map((opt) => (
          <Button
            key={opt.label}
            type="button"
            variant="outline"
            onClick={() => pickDays(opt.days)}
            className="crm-date-shortcut min-w-0"
          >
            {opt.label}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => setCustomOpen((v) => !v)}
          className="crm-date-shortcut min-w-0"
        >
          Custom date
        </Button>
      </div>
      {onCancel && (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={onCancel} className="h-8 px-2 text-xs">
            Cancel
          </Button>
        </div>
      )}
      {customOpen && (
        <div className="flex flex-col gap-2 border-t pt-2 sm:flex-row sm:items-center">
          <Input
            type="datetime-local"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="h-11 w-full md:h-9 sm:flex-1"
          />
          <Button
            type="button"
            onClick={handleCustomSubmit}
            disabled={!customValue}
            className="h-11 w-full px-4 md:h-9 sm:w-auto"
          >
            Set date
          </Button>
        </div>
      )}
    </div>
  );
};
