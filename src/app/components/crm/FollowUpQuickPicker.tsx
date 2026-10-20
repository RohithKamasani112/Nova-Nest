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
    <div className="space-y-2">
      {/* A predictable 2-column grid (instead of variable-width flex-wrap
          buttons) plus a 44px tap height on mobile — the old flex-wrap row
          of tightly-packed sm buttons was the "rough on mobile" complaint:
          easy to mis-tap and the row reflowed unpredictably at narrow
          popover widths. md: sizes restore the exact pre-existing desktop
          look (h-8 px-3, same as Button's old size="sm"). */}
      <div className="grid grid-cols-2 gap-2">
        {QUICK_OPTIONS.map((opt) => (
          <Button
            key={opt.label}
            type="button"
            variant="outline"
            onClick={() => pickDays(opt.days)}
            className="h-11 px-4 text-sm md:h-8 md:px-3 md:text-xs"
          >
            {opt.label}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => setCustomOpen((v) => !v)}
          className="h-11 px-4 text-sm md:h-8 md:px-3 md:text-xs"
        >
          Custom date
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="h-11 px-4 text-sm md:h-8 md:px-3 md:text-xs"
          >
            Cancel
          </Button>
        )}
      </div>
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
