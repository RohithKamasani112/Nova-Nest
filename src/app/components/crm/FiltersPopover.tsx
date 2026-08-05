import React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { MultiSelect, MultiSelectOption } from './MultiSelect';
import { LeadFiltersState } from '../../../types/crm';

interface FiltersPopoverProps {
  filters: LeadFiltersState;
  onChange: (patch: Partial<LeadFiltersState>) => void;
  sourceOptions: MultiSelectOption[];
  statusOptions: MultiSelectOption[];
  agentOptions: MultiSelectOption[];
  cityOptions: MultiSelectOption[];
  localityOptions: MultiSelectOption[];
  projectOptions: MultiSelectOption[];
  loading: boolean;
  activeCount: number;
  onClearAll: () => void;
}

// Source / Status / Agent / City / Locality / Project / Follow-up all live
// here now — they're secondary, used occasionally rather than daily, so
// they don't need permanent toolbar space. The chips row (ContactStatusChips)
// stays outside this popover — that's the daily workflow.
export const FiltersPopover: React.FC<FiltersPopoverProps> = ({
  filters,
  onChange,
  sourceOptions,
  statusOptions,
  agentOptions,
  cityOptions,
  localityOptions,
  projectOptions,
  loading,
  activeCount,
  onClearAll,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Filter size={14} />
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3" align="start">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Filters</span>
          {activeCount > 0 && (
            <button type="button" onClick={onClearAll} className="text-xs font-medium text-primary hover:underline">
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MultiSelect
            label="Source"
            options={sourceOptions}
            selected={filters.source ?? []}
            onChange={(v) => onChange({ source: v })}
            loading={loading}
            emptyLabel="No sources yet"
          />
          <MultiSelect
            label="Status"
            options={statusOptions}
            selected={filters.status ?? []}
            onChange={(v) => onChange({ status: v })}
            loading={loading}
            emptyLabel="No statuses yet"
          />
          <MultiSelect
            label="Agent"
            options={agentOptions}
            selected={filters.agentId ?? []}
            onChange={(v) => onChange({ agentId: v })}
            loading={loading}
            emptyLabel="No agents yet"
          />
          <MultiSelect
            label="City"
            options={cityOptions}
            selected={filters.city ?? []}
            onChange={(v) => onChange({ city: v })}
            loading={loading}
            emptyLabel="No cities yet"
          />
          <MultiSelect
            label="Locality"
            options={localityOptions}
            selected={filters.locality ?? []}
            onChange={(v) => onChange({ locality: v })}
            loading={loading}
            emptyLabel="No localities yet"
          />
          <MultiSelect
            label="Project"
            options={projectOptions}
            selected={filters.project ?? []}
            onChange={(v) => onChange({ project: v })}
            loading={loading}
            emptyLabel="No projects yet"
          />
        </div>

        <div>
          <Select
            value={filters.followUp ?? '__any__'}
            onValueChange={(v) => onChange({ followUp: v === '__any__' ? undefined : (v as LeadFiltersState['followUp']) })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Follow-up" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any follow-up</SelectItem>
              <SelectItem value="due_today">Due today</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="this_week">This week</SelectItem>
              <SelectItem value="none">None set</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
};
