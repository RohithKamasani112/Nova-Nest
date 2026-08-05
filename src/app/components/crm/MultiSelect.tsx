import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Skeleton } from '../ui/skeleton';
import { ChevronDown } from 'lucide-react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '../ui/command';

export interface MultiSelectOption {
  value: string;
  label: string;
  count?: number;
}

interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  loading?: boolean;
  emptyLabel?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  selected,
  onChange,
  loading = false,
  emptyLabel = 'No options',
}) => {
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="justify-between">
          {label}
          {selected.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/15 px-1.5 text-xs text-primary">{selected.length}</span>
          )}
          <ChevronDown size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
          <CommandList className="max-h-72">
            {loading ? (
              <div className="space-y-1 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full" />
                ))}
              </div>
            ) : (
              <>
                <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">{emptyLabel}</CommandEmpty>
                {options.map((opt) => (
                  <CommandItem key={opt.value} value={opt.label} onSelect={() => toggle(opt.value)}>
                    <Checkbox checked={selected.includes(opt.value)} className="pointer-events-none" />
                    <span className="flex-1 truncate">{opt.label}</span>
                    {opt.count !== undefined && <span className="text-xs text-muted-foreground">{opt.count}</span>}
                  </CommandItem>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
