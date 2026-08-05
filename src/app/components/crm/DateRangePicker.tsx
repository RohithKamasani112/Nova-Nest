import React, { useState } from 'react';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '../ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { formatIstRange, PERIOD_LABELS, PeriodPreset, PeriodRange, toIstDateInputValue } from '../../../utils/istDate';
import { DateRangeState } from './useDateRangeState';

interface DateRangePickerProps {
  state: DateRangeState;
  range: PeriodRange;
  onUpdate: (patch: Partial<DateRangeState>) => void;
}

// A4 fix: the old dateField Select's option text ("Lead Date — when the
// portal received the enquiry") was longer than its trigger, truncating
// mid-word. The explanation now lives in a tooltip instead of in the label.
export const DateRangePicker: React.FC<DateRangePickerProps> = ({ state, range, onUpdate }) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(undefined);

  const openCalendar = (open: boolean) => {
    setCalendarOpen(open);
    if (open) {
      setDraftRange(
        state.customFrom && state.customTo
          ? { from: new Date(`${state.customFrom}T00:00:00`), to: new Date(`${state.customTo}T00:00:00`) }
          : undefined
      );
    }
  };

  const applyCustomRange = () => {
    if (!draftRange?.from || !draftRange?.to) return;
    onUpdate({
      preset: 'custom',
      customFrom: toIstDateInputValue(draftRange.from.toISOString()),
      customTo: toIstDateInputValue(draftRange.to.toISOString()),
    });
    setCalendarOpen(false);
  };

  const resolvedRange = formatIstRange(range.from, range.to);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div title={resolvedRange}>
        <Select
          value={state.preset}
          onValueChange={(v) => {
            onUpdate({ preset: v as PeriodPreset });
            if (v === 'custom') openCalendar(true);
          }}
        >
          <SelectTrigger className="h-9 w-auto gap-1.5 whitespace-nowrap">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PERIOD_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state.preset === 'custom' && (
        <Popover open={calendarOpen} onOpenChange={openCalendar}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9">
              <CalendarIcon size={14} />
              {state.customFrom && state.customTo ? `${state.customFrom} → ${state.customTo}` : 'Pick dates'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <Calendar mode="range" numberOfMonths={2} weekStartsOn={1} selected={draftRange} onSelect={setDraftRange} />
            <div className="mt-2 flex justify-end gap-2 border-t pt-2">
              <Button variant="ghost" size="sm" onClick={() => setCalendarOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={applyCustomRange} disabled={!draftRange?.from || !draftRange?.to}>Apply</Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <div className="flex items-center gap-1">
        <Select value={state.dateField} onValueChange={(v) => onUpdate({ dateField: v as 'lead_date' | 'created_at' })}>
          <SelectTrigger className="h-9 w-auto gap-1.5 whitespace-nowrap">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lead_date">Lead date</SelectItem>
            <SelectItem value="created_at">Created date</SelectItem>
          </SelectContent>
        </Select>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground">
              <Info size={13} />
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-56">
            Lead date = when the portal received the enquiry. Created date = when it was uploaded here.
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
