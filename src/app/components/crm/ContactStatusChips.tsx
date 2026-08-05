import React, { useEffect, useRef, useState } from 'react';
import { getChipCounts } from '../../../services/crmApi';
import { ChipCounts, LeadFiltersState } from '../../../types/crm';

type ChipKey =
  | 'needs_contact'
  | 'contacted'
  | 'due_today'
  | 'overdue'
  | 'no_follow_up'
  | 'unassigned'
  | 'converted'
  | 'lost';

interface ChipDef {
  key: ChipKey;
  label: string;
  countKey: keyof ChipCounts;
  isActive: (f: LeadFiltersState) => boolean;
  activate: (f: LeadFiltersState) => LeadFiltersState;
  deactivate: (f: LeadFiltersState) => LeadFiltersState;
}

const CHIPS: ChipDef[] = [
  {
    key: 'needs_contact',
    label: 'Needs contact',
    countKey: 'needsContact',
    isActive: (f) => !!f.neverContacted && f.status?.length === 1 && f.status[0] === 'new',
    activate: (f) => ({ ...f, status: ['new'], neverContacted: true, page: 1 }),
    deactivate: (f) => ({ ...f, status: undefined, neverContacted: undefined, page: 1 }),
  },
  {
    key: 'contacted',
    label: 'Contacted',
    countKey: 'contacted',
    isActive: (f) => !!f.contacted,
    activate: (f) => ({ ...f, contacted: true, page: 1 }),
    deactivate: (f) => ({ ...f, contacted: undefined, page: 1 }),
  },
  {
    key: 'due_today',
    label: 'Follow-up due today',
    countKey: 'dueToday',
    isActive: (f) => f.followUp === 'due_today',
    activate: (f) => ({ ...f, followUp: 'due_today', page: 1 }),
    deactivate: (f) => ({ ...f, followUp: undefined, page: 1 }),
  },
  {
    key: 'overdue',
    label: 'Overdue',
    countKey: 'overdue',
    isActive: (f) => f.followUp === 'overdue',
    activate: (f) => ({ ...f, followUp: 'overdue', page: 1 }),
    deactivate: (f) => ({ ...f, followUp: undefined, page: 1 }),
  },
  {
    key: 'no_follow_up',
    label: 'No follow-up set',
    countKey: 'noFollowUpSet',
    isActive: (f) => !!f.noFollowUpSet,
    activate: (f) => ({ ...f, noFollowUpSet: true, page: 1 }),
    deactivate: (f) => ({ ...f, noFollowUpSet: undefined, page: 1 }),
  },
  {
    key: 'unassigned',
    label: 'Unassigned',
    countKey: 'unassigned',
    isActive: (f) => !!f.agentId && f.agentId.length === 1 && f.agentId[0] === 'unassigned',
    activate: (f) => ({ ...f, agentId: ['unassigned'], page: 1 }),
    deactivate: (f) => ({ ...f, agentId: undefined, page: 1 }),
  },
  {
    key: 'converted',
    label: 'Converted',
    countKey: 'converted',
    isActive: (f) => !!f.status && f.status.length === 1 && f.status[0] === 'converted',
    activate: (f) => ({ ...f, status: ['converted'], page: 1 }),
    deactivate: (f) => ({ ...f, status: undefined, page: 1 }),
  },
  {
    key: 'lost',
    label: 'Lost',
    countKey: 'lost',
    isActive: (f) => !!f.status && f.status.length === 1 && f.status[0] === 'closed_lost',
    activate: (f) => ({ ...f, status: ['closed_lost'], page: 1 }),
    deactivate: (f) => ({ ...f, status: undefined, page: 1 }),
  },
];

function activeChipKeys(filters: LeadFiltersState): ChipKey[] {
  return CHIPS.filter((c) => c.isActive(filters)).map((c) => c.key);
}

interface ContactStatusChipsProps {
  filters: LeadFiltersState;
  onChange: (next: LeadFiltersState) => void;
}

export const ContactStatusChips: React.FC<ContactStatusChipsProps> = ({ filters, onChange }) => {
  const [counts, setCounts] = useState<ChipCounts | null>(null);
  const hydratedFromUrl = useRef(false);

  useEffect(() => {
    getChipCounts().then(setCounts).catch(() => setCounts(null));
  }, []);

  // Hydrate active chips from ?chips=... once on mount, so a shared/bookmarked
  // URL reproduces the same quick filters.
  useEffect(() => {
    if (hydratedFromUrl.current) return;
    hydratedFromUrl.current = true;
    const params = new URLSearchParams(window.location.search);
    const keys = (params.get('chips') ?? '').split(',').filter(Boolean) as ChipKey[];
    if (keys.length === 0) return;
    let next = filters;
    for (const key of keys) {
      const chip = CHIPS.find((c) => c.key === key);
      if (chip) next = chip.activate(next);
    }
    onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL in sync with whichever chips are active.
  useEffect(() => {
    const keys = activeChipKeys(filters);
    const params = new URLSearchParams(window.location.search);
    if (keys.length > 0) params.set('chips', keys.join(','));
    else params.delete('chips');
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [filters]);

  const toggle = (chip: ChipDef) => {
    onChange(chip.isActive(filters) ? chip.deactivate(filters) : chip.activate(filters));
  };

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5">
      {CHIPS.map((chip) => {
        const active = chip.isActive(filters);
        const count = counts ? counts[chip.countKey] : null;
        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => toggle(chip)}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            style={
              active
                ? { background: 'var(--crm-gold)', borderColor: 'var(--crm-gold)', color: 'var(--crm-gold-text)' }
                : { background: 'var(--crm-surface)', borderColor: 'var(--crm-border)', color: 'var(--crm-text-primary)' }
            }
          >
            {chip.label}
            <span
              className="rounded-full px-1.5 text-[10px]"
              style={active ? { background: 'rgba(0,0,0,0.12)' } : { background: 'var(--crm-surface-hover)', color: 'var(--crm-text-secondary)' }}
            >
              {count === null ? '…' : count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
