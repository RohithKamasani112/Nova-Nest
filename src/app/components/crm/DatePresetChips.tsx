import React from 'react';
import { PeriodPreset } from '../../../utils/istDate';

export type DatePresetKey = 'all' | Extract<PeriodPreset, 'last_7_days' | 'last_30_days' | 'last_3_months'>;

const PRESETS: { key: DatePresetKey; label: string }[] = [
  { key: 'all', label: 'All time' },
  { key: 'last_7_days', label: 'Last 7 days' },
  { key: 'last_30_days', label: 'Last 30 days' },
  { key: 'last_3_months', label: 'Last 3 months' },
];

interface DatePresetChipsProps {
  active: DatePresetKey;
  onSelect: (key: DatePresetKey) => void;
}

// A simple "how old is this lead" filter for the field-facing sales view —
// the admin side already has a heavier DateRangePicker (custom calendar
// range, lead-date-vs-created-date toggle) that's overkill on a one-thumb
// phone screen. This is just four tap pills, same visual language as
// ContactStatusChips right below it.
export const DatePresetChips: React.FC<DatePresetChipsProps> = ({ active, onSelect }) => {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5">
      {PRESETS.map((p) => {
        const isActive = active === p.key;
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => onSelect(p.key)}
            className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
            style={
              isActive
                ? { background: 'var(--crm-gold)', borderColor: 'var(--crm-gold)', color: 'var(--crm-gold-text)' }
                : { background: 'var(--crm-surface)', borderColor: 'var(--crm-border)', color: 'var(--crm-text-primary)' }
            }
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
};
