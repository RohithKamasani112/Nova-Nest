import React, { useEffect, useState } from 'react';

import toast from 'react-hot-toast';
import { Search, Users } from 'lucide-react';
import { Input } from '../app/components/ui/input';
import { SourceQuickFilters } from '../app/components/crm/SourceQuickFilters';
import { ContactStatusChips } from '../app/components/crm/ContactStatusChips';
import { DatePresetChips, DatePresetKey } from '../app/components/crm/DatePresetChips';
import { LeadsTable } from '../app/components/crm/LeadsTable';
import { LeadDetailDrawer } from '../app/components/crm/LeadDetailDrawer';
import { TodaysCallsPanel } from '../app/components/crm/TodaysCallsPanel';
import { useLeadsTablePrefs } from '../app/components/crm/useLeadsTablePrefs';
import { listLeads } from '../services/crmApi';
import { LeadFiltersState, LeadListItem } from '../types/crm';
import { SALES_VIEW_AGENT_KEY, SALES_VIEW_AGENT_NAME_KEY } from '../utils/salesView';
import { computeIstPeriod } from '../utils/istDate';
import { useAuth } from '../contexts/AuthContext';

const PAGE_SIZE = 50;

// The sales team's whole view, deliberately just this one page — no
// Dashboard/Agents/Import History/Generate Bill/Settings, no bulk actions,
// no column/density/export toolbar. Reuses the exact components the mobile
// redesign already built (LeadsTable's card view, LeadDetailDrawer's
// call/outcome/status sticky footer) rather than a cut-down copy of
// CrmLeadsPage, since "search + work your leads" is already what those do.
export const SalesLeadsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { logout } = useAuth();
  const lockedAgentId = localStorage.getItem(SALES_VIEW_AGENT_KEY);
  const viewingName = localStorage.getItem(SALES_VIEW_AGENT_NAME_KEY) ?? 'All leads';

  const [filters, setFilters] = useState<LeadFiltersState>(() => ({
    page: 1,
    pageSize: PAGE_SIZE,
    ...(lockedAgentId && lockedAgentId !== 'all' ? { agentId: [lockedAgentId] } : {}),
  }));
  const [searchInput, setSearchInput] = useState('');
  const [datePreset, setDatePreset] = useState<DatePresetKey>('all');
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [mobileLoadedPage, setMobileLoadedPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const { visibleColumns, density } = useLeadsTablePrefs();

  const refresh = () => {
    setLoading(true);
    listLeads(filters)
      .then((r) => {
        setLeads(r.leads);
        setTotal(r.total);
      })
      .catch(() => toast.error('Could not load leads.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    setSelectedIds(new Set());
    setMobileLoadedPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadMore = async () => {
    const nextPage = mobileLoadedPage + 1;
    setLoadingMore(true);
    try {
      const r = await listLeads({ ...filters, page: nextPage });
      setLeads((prev) => [...prev, ...r.leads]);
      setMobileLoadedPage(nextPage);
    } catch {
      toast.error('Could not load more leads.');
    } finally {
      setLoadingMore(false);
    }
  };

  // "Last 1 week / 30 days / 3 months" leads — a simple age filter for the
  // field view, separate from ContactStatusChips' pipeline-stage filters.
  // Filters by lead_date (when the enquiry actually came in), not
  // created_at (when it was uploaded), since "how old is this lead" is
  // what a rep means by this.
  const handleDatePreset = (key: DatePresetKey) => {
    setDatePreset(key);
    if (key === 'all') {
      setFilters((p) => ({ ...p, dateField: undefined, dateFrom: undefined, dateTo: undefined, page: 1 }));
    } else {
      const range = computeIstPeriod(key);
      setFilters((p) => ({ ...p, dateField: 'lead_date', dateFrom: range.from, dateTo: range.to, page: 1 }));
    }
  };

  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(leads.map((l) => l.id)));
  const toggleOne = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="crm-workspace crm-sales-workspace mx-auto flex max-w-5xl flex-col gap-3 p-3 sm:p-5">
      <div className="crm-sales-header flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Leads</h1>
          <p className="text-sm text-gray-600">Viewing: {viewingName}</p>
        </div>
        <div className="crm-sales-controls flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('sales-home')}
            className="tap-target flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Users size={15} /> Switch
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="tap-target rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Same "who needs a call today" panel the full CRM Dashboard has —
          scoped to whatever this device is viewing (one agent, or 'all'),
          with its own agent picker hidden so a sales person locked to their
          own leads can't browse someone else's calls through it. */}
      <TodaysCallsPanel
        sourceScope={filters.source?.length === 1 ? filters.source[0] as import('../types/crm').CrmSource : undefined}
        agentScope={lockedAgentId ?? 'all'}
        onViewAll={(reminderFilters) => setFilters((p) => ({ ...p, ...reminderFilters, status: reminderFilters.status, page: 1 }))}
      />

      <div className="relative">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search name, phone, email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          enterKeyHint="search"
          className="tap-target w-full pl-8"
        />
      </div>

      <SourceQuickFilters source={filters.source} onChange={(source) => setFilters(p => ({ ...p, source, page: 1 }))} />
      <ContactStatusChips filters={filters} onChange={(next) => setFilters({ ...next, agentId: lockedAgentId && lockedAgentId !== 'all' ? [lockedAgentId] : next.agentId })} />
      <DatePresetChips active={datePreset} onSelect={handleDatePreset} />

      <LeadsTable
        leads={leads}
        loading={loading}
        selectedIds={selectedIds}
        onToggleOne={toggleOne}
        onToggleAll={toggleAll}
        allSelected={allSelected}
        onRowClick={setOpenLeadId}
        onChanged={refresh}
        density={density}
        visibleColumns={visibleColumns}
        hasActiveFilters={!!filters.search}
        onClearFilters={() => setSearchInput('')}
      />

      {!loading && leads.length < total && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="tap-target w-full rounded-lg border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-60"
        >
          {loadingMore ? 'Loading…' : `Load more (${leads.length} of ${total})`}
        </button>
      )}

      <LeadDetailDrawer leadId={openLeadId} onClose={() => setOpenLeadId(null)} onChanged={refresh} />
    </div>
  );
};
