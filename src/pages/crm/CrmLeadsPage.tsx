import { useCrmRefresh } from '../../app/components/crm/useCrmRefresh';
import { useAuth } from '../../contexts/AuthContext';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Search, Download, Settings2, Rows2, Rows3, X, XCircle, SlidersHorizontal, MoreVertical } from 'lucide-react';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../app/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../app/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../app/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '../../app/components/ui/sheet';
import { SourceQuickFilters } from '../../app/components/crm/SourceQuickFilters';
import { ContactStatusChips } from '../../app/components/crm/ContactStatusChips';
import { LeadsTable } from '../../app/components/crm/LeadsTable';
import { LeadDetailDrawer } from '../../app/components/crm/LeadDetailDrawer';
import { DateRangePicker } from '../../app/components/crm/DateRangePicker';
import { useDateRangeState } from '../../app/components/crm/useDateRangeState';
import { AgentFormDialog } from '../../app/components/crm/AgentFormDialog';
import { FiltersPopover, FilterFieldsContent } from '../../app/components/crm/FiltersPopover';
import { OPTIONAL_COLUMN_LABELS, OPTIONAL_COLUMNS, useLeadsTablePrefs } from '../../app/components/crm/useLeadsTablePrefs';
import { SOURCE_LABELS, SOURCE_STRIPE_VAR } from '../../app/components/crm/crmVisuals';
import {
  bulkLeadAction,
  downloadLeadsExportCsv,
  getFilterOptions,
  listLeads,
} from '../../services/crmApi';
import { FilterOptions, LeadFiltersState, LeadListItem } from '../../types/crm';

const EMPTY_OPTIONS: FilterOptions = {
  sources: [],
  statuses: [],
  agents: [],
  cities: [],
  localities: [],
  projects: [],
  propertyTypes: [],
  bhk: [],
  listingTypes: [],
};

const FOLLOW_UP_LABELS: Record<string, string> = {
  pending: 'All pending follow-ups',
  due_today: 'Due today',
  overdue: 'Overdue',
  this_week: 'This week',
  none: 'No follow-up set',
};

const FILTER_KEYS = ['source', 'status', 'agentId', 'city', 'locality', 'project'] as const;
type FilterListKey = (typeof FILTER_KEYS)[number];

interface CrmLeadsPageProps {
  initialFilters?: LeadFiltersState;
  onUploadClick?: () => void;
  onShareProperties?: (clientName: string, clientPhone: string | null, leadId: string) => void;
}

export const CrmLeadsPage: React.FC<CrmLeadsPageProps> = ({ initialFilters, onUploadClick, onShareProperties }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canAssign = isAdmin || user?.role === 'telecaller';
  const [rangeState, updateRange, period] = useDateRangeState();
  const [filters, setFilters] = useState<LeadFiltersState>({ page: 1, pageSize: 50, ...initialFilters });
  const [searchInput, setSearchInput] = useState(initialFilters?.search ?? '');
  const [searchExpanded, setSearchExpanded] = useState(!!initialFilters?.search);
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<FilterOptions>(EMPTY_OPTIONS);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [addAgentOpen, setAddAgentOpen] = useState(false);
  const { visibleColumns, toggleColumn, density, setDensity } = useLeadsTablePrefs();
  const reduceMotion = useReducedMotion();

  // Mobile-only: the toolbar's Source/Status/Agent/City/Locality/Project
  // fields move into a bottom sheet below md. Batched into a local draft
  // instead of writing straight to `filters` (like the desktop popover
  // does) — on a flaky connection, applying one query after every single
  // multi-select tap is worse than picking several filters and applying
  // once (see brief §0: "flaky 4G connection").
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileDraft, setMobileDraft] = useState<LeadFiltersState>(filters);

  // Mobile-only: "Load more" appends a page onto the existing list instead
  // of the desktop's Previous/Next, which replaces it. Tracked separately
  // from filters.page so desktop pagination (rangeStart/rangeEnd/Prev/Next
  // below) is completely untouched by this.
  const [mobileLoadedPage, setMobileLoadedPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadOptions = () => {
    setOptionsLoading(true);
    setOptionsError(false);
    getFilterOptions()
      .then(setOptions)
      .catch(() => {
        setOptionsError(true);
        toast.error('Could not load filter options.');
      })
      .finally(() => setOptionsLoading(false));
  };

  useEffect(() => {
    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = (background = false) => {
    if (!background) setLoading(true);
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
    setMobileDraft(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useCrmRefresh(() => refresh(true), mobileLoadedPage === 1 && selectedIds.size === 0);

  const loadMoreMobile = async () => {
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

  useEffect(() => {
    setFilters((prev) => ({ ...prev, dateField: rangeState.dateField, dateFrom: rangeState.preset === 'all' ? undefined : period.from, dateTo: rangeState.preset === 'all' ? undefined : period.to, page: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period.from, period.to, rangeState.dateField, rangeState.preset]);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const pageSize = filters.pageSize ?? 50;
  const page = filters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(leads.map((l) => l.id)));
  };
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sourceOptions = useMemo(
    () => options.sources.map((s) => ({ value: s, label: SOURCE_LABELS[s] ?? s })),
    [options.sources]
  );
  const statusOptions = useMemo(
    () => options.statuses.map((s) => ({ value: s.value, label: s.label, count: s.count })),
    [options.statuses]
  );
  const cityOptions = useMemo(
    () => options.cities.map((c) => ({ value: c.value, label: c.value, count: c.count })),
    [options.cities]
  );
  const localityOptions = useMemo(
    () => options.localities.map((c) => ({ value: c.value, label: c.value, count: c.count })),
    [options.localities]
  );
  const projectOptions = useMemo(
    () => options.projects.map((c) => ({ value: c.value, label: c.value, count: c.count })),
    [options.projects]
  );
  const agentOptions = useMemo(
    () => [
      { value: 'unassigned', label: 'Unassigned' },
      ...options.agents.map((a) => ({ value: a.id, label: a.name, count: a.count })),
    ],
    [options.agents]
  );

  const optionListsByKey: Record<FilterListKey, { value: string; label: string }[]> = {
    source: sourceOptions,
    status: statusOptions,
    agentId: agentOptions,
    city: cityOptions,
    locality: localityOptions,
    project: projectOptions,
  };
  const filterLabels: Record<FilterListKey, string> = {
    source: 'Source',
    status: 'Status',
    agentId: 'Team',
    city: 'City',
    locality: 'Locality',
    project: 'Project',
  };

  const activePills = useMemo(() => {
    const pills: { key: string; label: string; onRemove: () => void }[] = [];
    for (const key of FILTER_KEYS) {
      const values = filters[key] ?? [];
      for (const v of values) {
        const opt = optionListsByKey[key].find((o) => o.value === v);
        pills.push({
          key: `${key}-${v}`,
          label: `${filterLabels[key]}: ${opt?.label ?? v}`,
          onRemove: () =>
            setFilters((p) => ({ ...p, [key]: (p[key] ?? []).filter((x) => x !== v), page: 1 })),
        });
      }
    }
    if (filters.followUp) {
      pills.push({
        key: 'followUp',
        label: `Follow-up: ${FOLLOW_UP_LABELS[filters.followUp] ?? filters.followUp}`,
        onRemove: () => setFilters((p) => ({ ...p, followUp: undefined, page: 1 })),
      });
    }
    return pills;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sourceOptions, statusOptions, agentOptions, cityOptions, localityOptions, projectOptions]);

  const activeFilterDimensions = FILTER_KEYS.filter((k) => (filters[k]?.length ?? 0) > 0).length + (filters.followUp ? 1 : 0);

  const clearAllFilters = () => {
    setFilters((p) => ({
      ...p,
      source: undefined,
      status: undefined,
      agentId: undefined,
      city: undefined,
      locality: undefined,
      project: undefined,
      followUp: undefined,
      page: 1,
    }));
  };

  const hasActiveFilters = activeFilterDimensions > 0 || !!filters.search;

  // Mobile filter sheet: draft is seeded from `filters` whenever the sheet
  // opens (and reset whenever filters change elsewhere, in the effect
  // above), so it never opens showing stale selections.
  const openMobileFilters = () => {
    setMobileDraft(filters);
    setMobileFiltersOpen(true);
  };
  const mobileDraftActiveCount =
    FILTER_KEYS.filter((k) => (mobileDraft[k]?.length ?? 0) > 0).length + (mobileDraft.followUp ? 1 : 0);
  const clearMobileDraft = () => {
    setMobileDraft((p) => ({
      ...p,
      source: undefined,
      status: undefined,
      agentId: undefined,
      city: undefined,
      locality: undefined,
      project: undefined,
      followUp: undefined,
    }));
  };
  const applyMobileFilters = () => {
    setFilters((p) => ({ ...p, ...mobileDraft, page: 1 }));
    setMobileFiltersOpen(false);
  };

  const handleBulkStatus = async (status: string) => {
    let lostReason: string | undefined;
    if (status === 'closed_lost') {
      const input = window.prompt('Lost reason for the selected leads (e.g. Budget mismatch, Not responding)?');
      if (!input) return; // cancelled — don't apply a partial bulk close
      lostReason = input;
    }
    try {
      const { affected } = await bulkLeadAction(Array.from(selectedIds), 'change_status', { status, lostReason });
      toast.success(`Updated ${affected} lead(s).`);
      refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Bulk status update failed.');
    }
  };

  const handleBulkAgent = async (agentId: string) => {
    try {
      const { affected } = await bulkLeadAction(Array.from(selectedIds), 'assign_agent', {
        agentId: agentId === '__unassigned__' ? null : agentId,
      });
      toast.success(`Reassigned ${affected} lead(s).`);
      refresh();
    } catch {
      toast.error('Bulk reassignment failed.');
    }
  };

  return (
    <div className="crm-leads-workspace flex flex-col gap-4">
      {/* Mobile toolbar — below md: sticky full-width search + a single
          Filters button (badged with the active-count) + a small overflow
          menu for Export. Density toggle, column visibility, and page size
          are dropped entirely (not just hidden) — they only mean anything
          for the desktop table, and below md, LeadsTable renders its card
          view instead. */}
      <div
        className="crm-mobile-toolbar sticky z-20 flex items-center gap-2 py-2 md:hidden"
        // top clears the fixed hamburger button (AdminSidebar.tsx: offset
        // 0.75rem + its own 2.75rem height) plus the safe-area inset, so
        // once this bar is stuck at the top of the scroll it sits just
        // below the hamburger instead of partly behind it (hamburger is
        // z-40, this is z-20, and both would otherwise occupy the same
        // top-left corner once scrolled).
        style={{ top: 'calc(4.5rem + env(safe-area-inset-top))', background: 'var(--crm-surface)' }}
      >
        <div className="relative flex-1">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search leads by name, phone or email"
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            enterKeyHint="search"
            className="tap-target w-full pl-8"
          />
        </div>
        <Button variant="outline" onClick={openMobileFilters} className="tap-target relative shrink-0">
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterDimensions > 0 && (
            <span className="ml-0.5 rounded-full bg-primary px-1.5 text-xs font-medium text-white">
              {activeFilterDimensions}
            </span>
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="tap-target shrink-0" aria-label="More actions">
              <MoreVertical size={15} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => downloadLeadsExportCsv(filters)}>
              <Download size={14} /> Export CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop toolbar — md and up, unchanged. Search collapses to an
          icon below 1280px; result range + density/columns/export sit on
          the right and wrap onto their own line at narrower widths. */}
      <div className="crm-inbox-toolbar hidden flex-wrap items-center gap-2 md:flex">
        <div className="hidden items-center xl:flex">
          <div className="relative">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, phone, email, project..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-56 pl-8"
            />
          </div>
        </div>
        <div className="xl:hidden">
          {searchExpanded ? (
            <div className="relative">
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onBlur={() => !searchInput && setSearchExpanded(false)}
                className="w-48 pl-8"
              />
            </div>
          ) : (
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setSearchExpanded(true)} aria-label="Search">
              <Search size={15} />
            </Button>
          )}
        </div>

        <DateRangePicker state={rangeState} range={period} onUpdate={updateRange} />

        {/* Agent — pulled out of the Filters popover into the main toolbar
            since it's a daily "whose leads am I looking at" control, not an
            occasional one. Single-select convenience on top of the same
            filters.agentId array the popover's multi-select also writes to —
            picking a name here just sets that array to one value. Export
            (right side of this toolbar) already sends whatever's in
            `filters`, agentId included, so exporting "just this agent's
            leads" is just: pick them here, then Export. */}
        <Select
          value={filters.agentId?.length === 1 ? filters.agentId[0] : '__all__'}
          onValueChange={(v) => setFilters((p) => ({ ...p, agentId: v === '__all__' ? undefined : [v], page: 1 }))}
        >
          <SelectTrigger className="h-9 w-auto gap-1.5 whitespace-nowrap">
            <SelectValue placeholder="Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All team members</SelectItem>
            {agentOptions.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
                {'count' in a ? ` (${a.count})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <FiltersPopover
          filters={filters}
          onChange={(patch) => setFilters((p) => ({ ...p, ...patch, page: 1 }))}
          sourceOptions={sourceOptions}
          statusOptions={statusOptions}
          agentOptions={agentOptions}
          cityOptions={cityOptions}
          localityOptions={localityOptions}
          projectOptions={projectOptions}
          loading={optionsLoading}
          activeCount={activeFilterDimensions}
          onClearAll={clearAllFilters}
        />

        {optionsError && (
          <Button variant="outline" onClick={loadOptions} className="h-9 text-destructive">
            Retry filters
          </Button>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="tabular-nums text-sm text-muted-foreground">
            {rangeStart}–{rangeEnd} of {total}
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setFilters((p) => ({ ...p, pageSize: Number(v), page: 1 }))}
          >
            <SelectTrigger className="h-9 w-auto gap-1 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setDensity(density === 'compact' ? 'comfortable' : 'compact')}
                className="tap-target flex h-9 w-9 items-center justify-center rounded-md border"
                style={{
                  borderColor: 'var(--crm-border)',
                  background: 'var(--crm-surface)',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.08)',
                }}
                aria-label="Toggle row density"
              >
                {density === 'compact' ? <Rows3 size={15} /> : <Rows2 size={15} />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{density === 'compact' ? 'Compact' : 'Comfortable'} — click to toggle</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Columns">
                <Settings2 size={15} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Optional columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {OPTIONAL_COLUMNS.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col}
                  checked={visibleColumns.has(col)}
                  onCheckedChange={() => toggleColumn(col)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {OPTIONAL_COLUMN_LABELS[col]}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Source</DropdownMenuLabel>
              <div className="space-y-1.5 px-2 py-1.5">
                {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: SOURCE_STRIPE_VAR[key] }} />
                    {label}
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" className="h-9" onClick={() => downloadLeadsExportCsv(filters)}>
            <Download size={14} /> Export
          </Button>
        </div>
      </div>

      {/* Active filter pills — only when set */}
      {activePills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activePills.map((pill) => (
            <span
              key={pill.key}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
              style={{ borderColor: 'var(--crm-border)', color: 'var(--crm-text-secondary)' }}
            >
              {pill.label}
              <button type="button" onClick={pill.onRemove} aria-label={`Remove ${pill.label}`}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Bulk action bar — slides up from the bottom when rows are selected,
          so the checkboxes have something behind them instead of sitting
          there with no visible effect until you notice the static bar above
          the table. */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={reduceMotion ? false : { y: 64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { y: 64, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 mx-auto flex w-fit max-w-[calc(100%-2rem)] flex-wrap items-center gap-2 rounded-xl border bg-white px-4 py-3 shadow-lg"
            style={{ borderColor: 'var(--crm-border)' }}
          >
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <Select onValueChange={handleBulkStatus}>
              <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Change status..." /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {canAssign && <Select onValueChange={(v) => (v === '__add_new__' ? setAddAgentOpen(true) : handleBulkAgent(v))}>
              <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Assign team member..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__unassigned__">Unassigned</SelectItem>
                {options.agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                {isAdmin && <SelectItem value="__add_new__" className="text-primary">+ Add new team member</SelectItem>}
              </SelectContent>
            </Select>}
            <Button variant="ghost" className="h-9 gap-1.5 text-muted-foreground" onClick={() => setSelectedIds(new Set())}>
              <XCircle size={14} /> Clear
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chips — the daily workflow, permanent space, single scrollable row */}
      <SourceQuickFilters source={filters.source} onChange={(source) => setFilters(p => ({ ...p, source, page: 1 }))} />
      <ContactStatusChips filters={filters} onChange={setFilters} />

      <LeadsTable
        teamOptions={agentOptions}
        leads={leads}
        loading={loading}
        selectedIds={selectedIds}
        onToggleOne={toggleOne}
        onToggleAll={toggleAll}
        allSelected={allSelected}
        onRowClick={setOpenLeadId}
        onChanged={() => refresh()}
        density={density}
        visibleColumns={visibleColumns}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearAllFilters}
        onUploadClick={onUploadClick}
      />

      {/* Sticky footer — the table above scrolls internally and can run to
          thousands of pixels tall, so pagination stays pinned to the bottom
          of the viewport instead of trailing off past a long inner scroll
          the user has to find their way past first. */}
      <div
        className="sticky bottom-0 z-10 hidden items-center justify-between gap-3 border-t px-3 py-2.5 text-sm shadow-[0_-2px_8px_rgba(0,0,0,0.04)] md:flex"
        style={{ background: 'var(--crm-surface)', borderColor: 'var(--crm-border)' }}
      >
        <span className="tabular-nums text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" className="h-9" disabled={page <= 1} onClick={() => setFilters((p) => ({ ...p, page: page - 1 }))}>
            Previous
          </Button>
          <Button variant="outline" className="h-9" disabled={page >= totalPages} onClick={() => setFilters((p) => ({ ...p, page: page + 1 }))}>
            Next
          </Button>
        </div>
      </div>

      {/* Mobile — Load more appends a page instead of paginating, which
          the brief calls out as the better mobile interaction anyway. */}
      {!loading && leads.length < total && (
        <div className="pb-1 md:hidden">
          <button
            type="button"
            onClick={loadMoreMobile}
            disabled={loadingMore}
            className="tap-target flex w-full items-center justify-center rounded-lg border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-60"
          >
            {loadingMore ? 'Loading…' : `Load more (${leads.length} of ${total})`}
          </button>
        </div>
      )}

      {/* Mobile Filters sheet — Source/Status/Agent/City/Locality/Project/
          Follow-up (same fields FiltersPopover renders on desktop) plus the
          date range, batched into mobileDraft and only sent to `filters`
          (i.e. only re-queried) on Apply. */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <DateRangePicker state={rangeState} range={period} onUpdate={updateRange} />
            <FilterFieldsContent
              filters={mobileDraft}
              onChange={(patch) => setMobileDraft((p) => ({ ...p, ...patch }))}
              sourceOptions={sourceOptions}
              statusOptions={statusOptions}
              agentOptions={agentOptions}
              cityOptions={cityOptions}
              localityOptions={localityOptions}
              projectOptions={projectOptions}
              loading={optionsLoading}
            />
          </div>
          <SheetFooter className="flex-row gap-2 border-t px-4 py-3">
            <button
              type="button"
              onClick={clearMobileDraft}
              className="tap-target flex-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={applyMobileFilters}
              className="tap-target flex-1 rounded-lg bg-primary text-sm font-medium text-white"
            >
              Apply{mobileDraftActiveCount > 0 ? ` (${mobileDraftActiveCount})` : ''}
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <LeadDetailDrawer
        leadId={openLeadId}
        onClose={() => setOpenLeadId(null)}
        onChanged={() => refresh()}
        onShareProperties={onShareProperties}
      />
      <AgentFormDialog
        open={addAgentOpen}
        onClose={() => setAddAgentOpen(false)}
        onSaved={(newAgent) => {
          setOptions((prev) => ({ ...prev, agents: [...prev.agents, { id: newAgent.id, name: newAgent.name, count: 0 }] }));
        }}
      />
    </div>
  );
};
