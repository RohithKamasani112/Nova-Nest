import React from 'react';
import { CrmSource } from '../../../types/crm';

const SOURCES: { value: CrmSource; label: string }[] = [
  { value: 'magicbricks', label: 'MagicBricks' },
  { value: '99acres', label: '99acres' },
  { value: 'housing', label: 'Housing' },
];
export const SourceQuickFilters: React.FC<{
  source?: string[];
  onChange: (source: CrmSource[] | undefined) => void;
}> = ({ source, onChange }) => (
  <div className="crm-source-filters" role="group" aria-label="Lead source">
    <button type="button" aria-pressed={!source?.length} onClick={() => onChange(undefined)}>All leads</button>
    {SOURCES.map(item => <button key={item.value} type="button" aria-pressed={source?.length === 1 && source[0] === item.value} onClick={() => onChange([item.value])}>{item.label}</button>)}
  </div>
);
