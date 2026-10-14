import React from 'react';
import { UserRoundPen } from 'lucide-react';
import { CrmSource } from '../../../types/crm';
import { useAuth } from '../../../contexts/AuthContext';

const SOURCES: { value: CrmSource; label: string }[] = [
  { value: 'magicbricks', label: 'MagicBricks' },
  { value: '99acres', label: '99acres' },
  { value: 'housing', label: 'Housing' },
];
export const SourceQuickFilters: React.FC<{
  source?: string[];
  onChange: (source: CrmSource[] | undefined) => void;
}> = ({ source, onChange }) => {
  const { user } = useAuth();
  return (
  <div className="crm-source-filters" role="group" aria-label="Lead source">
    <button type="button" aria-pressed={!source?.length} onClick={() => onChange(undefined)}>All leads</button>
    {SOURCES.filter(item => user?.role !== 'telecaller' || user.source_scope?.includes(item.value)).map(item => <button key={item.value} type="button" aria-pressed={source?.length === 1 && source[0] === item.value} onClick={() => onChange([item.value])}>{item.label}</button>)}
    {(user?.role !== 'telecaller' || user.source_scope?.includes('website')) && <button type="button" className="inline-flex items-center gap-1.5" aria-pressed={source?.length === 2 && source.includes('website') && source.includes('personal')} onClick={() => onChange(['website', 'personal'])}><UserRoundPen size={14} aria-hidden="true" />Custom</button>}
  </div>
);
};
