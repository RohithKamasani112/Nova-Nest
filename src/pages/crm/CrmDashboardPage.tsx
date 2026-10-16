import { useCrmRefresh } from '../../app/components/crm/useCrmRefresh';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
} from 'recharts';
import { ArrowDown, ArrowUp, AlertCircle, ChevronDown } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../app/components/ui/table';
import { getAgentLeaderboard, getKpis } from '../../services/crmApi';
import { AgentLeaderboardRow, KpiResponse, LeadFiltersState, CrmSource } from '../../types/crm';
import { CATEGORICAL, SEQUENTIAL, STATUS, SOURCE_COLOR } from '../../app/components/crm/kpiPalette';
import { SourceQuickFilters } from '../../app/components/crm/SourceQuickFilters';
import { TodaysCallsPanel } from '../../app/components/crm/TodaysCallsPanel';
import { DateRangePicker } from '../../app/components/crm/DateRangePicker';
import { Button } from '../../app/components/ui/button';
import { SOURCE_LABELS } from '../../app/components/crm/crmVisuals';
import { useDateRangeState } from '../../app/components/crm/useDateRangeState';

interface CrmDashboardPageProps {
  onDrillDown: (filters: LeadFiltersState) => void;
}

const GOOD_UP = new Set(['totalLeads', 'newLeads', 'contacted', 'siteVisitsDone', 'converted', 'totalDealValue']);
const GOOD_DOWN = new Set(['closedLost', 'junk']);

const compactRupees = (value: number) => value >= 10000000 ? `₹${(value / 10000000).toLocaleString('en-IN', {maximumFractionDigits: 2})} Cr` : value >= 100000 ? `₹${(value / 100000).toLocaleString('en-IN', {maximumFractionDigits: 2})} L` : `₹${value.toLocaleString('en-IN')}`;

const DeltaBadge: React.FC<{ metric: string; delta: number | null }> = ({ metric, delta }) => {
  if (delta === null) return null;
  const isGoodDirection = GOOD_UP.has(metric) ? delta >= 0 : GOOD_DOWN.has(metric) ? delta <= 0 : delta >= 0;
  const color = GOOD_UP.has(metric) || GOOD_DOWN.has(metric) ? (isGoodDirection ? STATUS.good : STATUS.critical) : '#64748b';
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium" title="Compared with the previous period" style={{ color }}>
      {delta >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {Math.abs(delta)}%
    </span>
  );
};

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  metricKey?: string;
  delta?: number | null;
  onClick?: () => void;
  danger?: boolean;
}> = ({ label, value, metricKey, delta, onClick, danger }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`flex min-w-0 flex-col gap-1 rounded-xl border p-3 text-left transition-shadow sm:p-4 ${onClick ? 'cursor-pointer hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary' : 'cursor-default'} ${danger ? 'border-red-200 bg-red-50' : 'bg-white'}`}
  >
    <span className="break-words text-xs font-medium text-muted-foreground">{label}</span>
    <div className="flex min-w-0 flex-wrap items-baseline gap-2">
      <span className="min-w-0 text-xl font-bold text-gray-900 sm:text-2xl" style={{overflowWrap: 'anywhere'}}>{value}</span>
      {metricKey && <DeltaBadge metric={metricKey} delta={delta ?? null} />}
    </div>
  </button>
);

export const CrmDashboardPage: React.FC<CrmDashboardPageProps> = ({ onDrillDown }) => {
  const [rangeState, updateRange, period] = useDateRangeState();
  const dateField = rangeState.dateField;
  const [data, setData] = useState<KpiResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<AgentLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const requestVersion = useRef(0);
  const [source, setSource] = useState<CrmSource[] | undefined>();

  const loadDashboard = (background = false) => {
    const version = ++requestVersion.current;
    if (!background) setLoadError(false);
    if (!background) setLoading(true);
    Promise.all([
      getKpis({ ...period, dateField, source: source?.length === 2 && source.includes('website') ? 'custom' : source?.[0] }),
      getAgentLeaderboard({ ...period, dateField, source: source?.length === 2 && source.includes('website') ? 'custom' : source?.[0] }),
    ])
      .then(([kpis, agents]) => {
        if (version !== requestVersion.current) return;
        setLoadError(false);
        setData(kpis);
        setLeaderboard(agents.leaderboard);
      })
      .catch(() => { if (version === requestVersion.current) { setLoadError(true); toast.error('Could not load dashboard data.'); } })
      .finally(() => { if (version === requestVersion.current) setLoading(false); });
  };
  useEffect(() => { loadDashboard(); }, [period.from, period.to, dateField, source]);
  useCrmRefresh(() => loadDashboard(true));
  useEffect(() => () => { requestVersion.current++; }, []);

  const drill = (extra: LeadFiltersState) => onDrillDown({ source, dateField, ...(rangeState.preset === 'all' || extra.followUp === 'overdue' || extra.followUp === 'pending' ? {} : { dateFrom: period.from, dateTo: period.to }), ...extra });

  if (loadError) return <div role="alert" className="rounded-xl border border-red-100 bg-red-50 p-5"><p className="font-semibold">Dashboard could not be loaded</p><p className="mb-3 mt-1 text-sm text-muted-foreground">Try again to load the selected period and source.</p><Button variant="outline" onClick={() => loadDashboard()}>Retry dashboard</Button></div>;
  if (loading || !data) {
    return <div className="py-16 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  const { current, deltas, followUps } = data.scorecards;

  return (
    <div className="space-y-6">
      <DateRangePicker state={rangeState} range={period} onUpdate={updateRange} />
      <SourceQuickFilters source={source} onChange={setSource} />

      <p className="text-xs text-muted-foreground">Daily reminders cover all active follow-ups. Performance figures and charts use the selected period.{rangeState.preset !== 'all' && ' Percentage changes compare with the previous period.'}</p>
      <TodaysCallsPanel sourceScope={source} onViewAll={filters => onDrillDown({ ...filters, source })} />

      <section aria-label="Performance overview"><h2 className="mb-3 text-base font-semibold">Performance overview</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Leads" value={current.totalLeads} metricKey="totalLeads" delta={rangeState.preset === 'all' ? null : deltas.totalLeads} onClick={() => drill({})} />
        <StatCard label="New Leads" value={current.newLeads} metricKey="newLeads" delta={rangeState.preset === 'all' ? null : deltas.newLeads} onClick={() => drill({ status: ['new'] })} />
        <StatCard label="Contacted" value={current.contacted} metricKey="contacted" delta={rangeState.preset === 'all' ? null : deltas.contacted} onClick={() => drill({ contacted: true })} />
        <StatCard label="Site Visits Done" value={current.siteVisitsDone} metricKey="siteVisitsDone" delta={rangeState.preset === 'all' ? null : deltas.siteVisitsDone} onClick={() => drill({ status: ['site_visit_done'] })} />
        <StatCard label="Converted" value={`${current.converted} (${current.conversionRate}%)`} metricKey="converted" delta={rangeState.preset === 'all' ? null : deltas.converted} onClick={() => drill({ status: ['converted'] })} />
        <StatCard label="Closed / Lost" value={`${current.closedLost} (${current.lossRate}%)`} metricKey="closedLost" delta={rangeState.preset === 'all' ? null : deltas.closedLost} onClick={() => drill({ status: ['closed_lost'] })} />
        <StatCard label="Junk" value={current.junk} metricKey="junk" delta={rangeState.preset === 'all' ? null : deltas.junk} onClick={() => drill({ status: ['junk'] })} />
        <StatCard label="Repeat enquiries" value={current.duplicatesBlocked} metricKey="duplicatesBlocked" delta={rangeState.preset === 'all' ? null : deltas.duplicatesBlocked} />
        <StatCard label="Total Deal Value" value={<span title={`₹${current.totalDealValue.toLocaleString('en-IN')}`}><span className="sm:hidden" aria-label={`₹${current.totalDealValue.toLocaleString('en-IN')}`}>{compactRupees(current.totalDealValue)}</span><span className="hidden sm:inline">₹{current.totalDealValue.toLocaleString('en-IN')}</span></span>} metricKey="totalDealValue" delta={rangeState.preset === 'all' ? null : deltas.totalDealValue} onClick={() => drill({ status: ['converted'] })} />
        <StatCard label="Avg. Response Time" value={current.avgResponseHours !== null ? `${current.avgResponseHours}h` : '—'} />
        <StatCard label="Pending Follow-ups" value={followUps.pending} onClick={() => drill({ followUp: 'pending' })} />
        <StatCard label="Overdue Follow-ups" value={followUps.overdue} danger onClick={() => drill({ followUp: 'overdue' })} />
      </div>

      </section>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Leads by Source" empty={!data.bySource.some(item => item.total > 0)}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.bySource}
                dataKey="total"
                nameKey="source"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                onClick={(d: any) => drill({ source: [d.source] })}
                cursor="pointer"
              >
                {data.bySource.map((entry) => (
                  <Cell key={entry.source} fill={SOURCE_COLOR[entry.source] ?? CATEGORICAL[0]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number, _name, props: any) => [`${value} leads (${props.payload.conversionRate}% converted)`, SOURCE_LABELS[props.payload.source] ?? props.payload.source]} />
              <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value: string) => SOURCE_LABELS[value] ?? value} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Leads Over Time" empty={!data.timeSeries.series.some(item => item.total > 0)}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.timeSeries.series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" />
              <XAxis dataKey="bucket" tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip labelFormatter={(v) => new Date(v as string).toLocaleDateString()} />
              <Line type="monotone" dataKey="total" stroke={SEQUENTIAL} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Pipeline Funnel" empty={!data.funnel.some(item => item.count > 0)}>
          <div className="space-y-2 py-2">
            {data.funnel.map((stage) => {
              const barPct = Math.max(0, (stage.count / Math.max(1, ...data.funnel.map(item => item.count))) * 100);
              return (
                <button
                  key={stage.stage}
                  onClick={() => drill({ status: [stage.stage] })}
                  className="block w-full rounded-lg p-1.5 text-left hover:bg-accent"
                >
                  {/* Below sm: the fixed w-32/w-16/w-16 columns the desktop
                      row uses leave the bar itself only ~60-90px wide on a
                      phone. Stack label+count above a full-width bar instead. */}
                  <div className="sm:hidden">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="capitalize text-muted-foreground">{stage.stage.replace(/_/g, ' ')}</span>
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground">{stage.count}</span>
                        {stage.dropOffPct > 0 && <> · -{stage.dropOffPct}%</>}
                      </span>
                    </div>
                    <div className="h-6 overflow-hidden rounded bg-muted">
                      <div className="h-full rounded" style={{ width: `${barPct}%`, backgroundColor: SEQUENTIAL }} />
                    </div>
                  </div>

                  {/* sm and up — original side-by-side row, unchanged. */}
                  <div className="hidden items-center gap-3 sm:flex">
                    <div className="w-32 shrink-0 text-xs capitalize text-muted-foreground">{stage.stage.replace(/_/g, ' ')}</div>
                    <div className="h-6 flex-1 overflow-hidden rounded bg-muted">
                      <div className="h-full rounded" style={{ width: `${barPct}%`, backgroundColor: SEQUENTIAL }} />
                    </div>
                    <div className="w-16 shrink-0 text-right text-sm font-medium">{stage.count}</div>
                    {stage.dropOffPct > 0 && <div className="w-16 shrink-0 text-right text-xs text-muted-foreground">-{stage.dropOffPct}%</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </ChartCard>

        <ChartCard title="Rent vs Sale Split" empty={!data.listingTypeSplit.some(item => item.total > 0)}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.listingTypeSplit} dataKey="total" nameKey="value" cx="50%" cy="50%" outerRadius={80} onClick={(entry: any) => { if (typeof entry.payload?.value === 'string') drill({ listingType: [entry.payload.value] }); }} cursor="pointer">
                {data.listingTypeSplit.map((entry, i) => (
                  <Cell key={entry.value} fill={CATEGORICAL[i % CATEGORICAL.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <TopListCard title="Leads by City (Top 10)" items={data.topCities} onClick={(v) => drill({ city: [v] })} />
        <TopListCard title="Leads by Project (Top 10)" items={data.topProjects} onClick={(v) => drill({ project: [v] })} />

        <ChartCard title="BHK Distribution" empty={!data.bhkDistribution.some(item => item.total > 0)}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.bhkDistribution} onClick={(e: any) => e?.activePayload && drill({ bhk: [e.activePayload[0].payload.value] })}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
              <XAxis dataKey="value" tickFormatter={(v) => `${v} BHK`} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill={SEQUENTIAL} radius={[4, 4, 0, 0]} cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Team performance</h2>
        {!leaderboard.length && <p className="rounded-xl border bg-white p-5 text-sm text-muted-foreground">No team activity for this period and source.</p>}

        {/* Mobile — below md: reads like a ranking (rank, name, headline
            metric), not a horizontally-scrolled 11-column table. Tap a row
            to reveal the rest. */}
        <div className="space-y-2 md:hidden">
          {leaderboard.map((a, index) => (
            <LeaderboardCard key={a.agentId} agent={a} rank={index + 1} drill={drill} />
          ))}
        </div>

        {/* Desktop table — md and up, unchanged. */}
        <div className={leaderboard.length ? "hidden overflow-x-auto rounded-xl border bg-white md:block" : "hidden"}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>New</TableHead>
                <TableHead>Contacted</TableHead>
                <TableHead>Site Visits</TableHead>
                <TableHead>Converted</TableHead>
                <TableHead>Conv. %</TableHead>
                <TableHead>Lost</TableHead>
                <TableHead>Avg Response</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Deal Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((a) => (
                <TableRow key={a.agentId}>
                  <TableCell className="font-medium">{a.agentName}</TableCell>
                  <TableCell><button className="hover:underline" onClick={() => drill({ agentId: [a.agentId] })}>{a.total}</button></TableCell>
                  <TableCell><button className="hover:underline" onClick={() => drill({ agentId: [a.agentId], status: ['new'] })}>{a.newLeads}</button></TableCell>
                  <TableCell>{a.contacted}</TableCell>
                  <TableCell><button className="hover:underline" onClick={() => drill({ agentId: [a.agentId], status: ['site_visit_done'] })}>{a.siteVisits}</button></TableCell>
                  <TableCell><button className="hover:underline" onClick={() => drill({ agentId: [a.agentId], status: ['converted'] })}>{a.converted}</button></TableCell>
                  <TableCell>{a.conversionRate}%</TableCell>
                  <TableCell><button className="hover:underline" onClick={() => drill({ agentId: [a.agentId], status: ['closed_lost'] })}>{a.lost}</button></TableCell>
                  <TableCell>{a.avgResponseHours !== null ? `${a.avgResponseHours}h` : '—'}</TableCell>
                  <TableCell>
                    {a.overdueFollowUps > 0 ? (
                      <button className="inline-flex items-center gap-1 text-red-600 hover:underline" onClick={() => drill({ agentId: [a.agentId], followUp: 'overdue' })}>
                        <AlertCircle size={12} /> {a.overdueFollowUps}
                      </button>
                    ) : '0'}
                  </TableCell>
                  <TableCell>₹{a.dealValue.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

// Mobile leaderboard row — rank + name + the headline metric (Converted,
// with Conv.% alongside it) up front; every other figure from the desktop
// table sits behind a tap-to-expand instead of a horizontal scroll.
const LeaderboardCard: React.FC<{
  agent: AgentLeaderboardRow;
  rank: number;
  drill: (extra: LeadFiltersState) => void;
}> = ({ agent: a, rank, drill }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
            {rank}
          </span>
          <span className="truncate font-semibold text-gray-900">{a.agentName}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <div className="font-bold text-gray-900">{a.converted}</div>
            <div className="text-xs text-gray-500">{a.conversionRate}% conv.</div>
          </div>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-0.5 border-t border-gray-100 pt-2 text-sm" onClick={(e) => e.stopPropagation()}>
          <LeaderboardStatRow label="Total leads" value={a.total} onClick={() => drill({ agentId: [a.agentId] })} />
          <LeaderboardStatRow label="New" value={a.newLeads} onClick={() => drill({ agentId: [a.agentId], status: ['new'] })} />
          <LeaderboardStatRow label="Contacted" value={a.contacted} />
          <LeaderboardStatRow label="Site visits" value={a.siteVisits} onClick={() => drill({ agentId: [a.agentId], status: ['site_visit_done'] })} />
          <LeaderboardStatRow label="Lost" value={a.lost} onClick={() => drill({ agentId: [a.agentId], status: ['closed_lost'] })} />
          <LeaderboardStatRow label="Avg response" value={a.avgResponseHours !== null ? `${a.avgResponseHours}h` : '—'} />
          <LeaderboardStatRow
            label="Overdue"
            value={a.overdueFollowUps}
            danger={a.overdueFollowUps > 0}
            onClick={a.overdueFollowUps > 0 ? () => drill({ agentId: [a.agentId], followUp: 'overdue' }) : undefined}
          />
          <LeaderboardStatRow label="Deal value" value={`₹${a.dealValue.toLocaleString('en-IN')}`} />
        </div>
      )}
    </div>
  );
};

const LeaderboardStatRow: React.FC<{
  label: string;
  value: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
}> = ({ label, value, danger, onClick }) => {
  const valueClass = danger ? 'font-semibold text-red-600' : 'font-medium text-gray-900';
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className="tap-target flex w-full items-center justify-between rounded-lg px-1 hover:bg-gray-50"
    >
      <span className="text-gray-600">{label}</span>
      <span className={valueClass}>{value}</span>
    </button>
  ) : (
    <div className="flex min-h-[32px] items-center justify-between px-1">
      <span className="text-gray-600">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode; empty?: boolean }> = ({ title, children, empty }) => (
  <div className="min-w-0 rounded-xl border bg-white p-4">
    <h3 className="mb-2 text-sm font-semibold text-gray-900">{title}</h3>
    {empty ? <div className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">No data for this period and source.</div> : children}
  </div>
);

const TopListCard: React.FC<{ title: string; items: { value: string; total: number }[]; onClick: (value: string) => void }> = ({ title, items, onClick }) => {
  const max = Math.max(1, ...items.map((i) => i.total));
  return (
    <ChartCard title={title}>
      <div className="space-y-1.5 py-1">
        {items.length === 0 && <p className="text-xs text-muted-foreground">No data.</p>}
        {items.map((item) => (
          <button key={item.value} onClick={() => onClick(item.value)} className="flex w-full min-w-0 items-center gap-2 rounded p-1 text-left hover:bg-accent">
            <span className="w-24 shrink-0 truncate text-xs sm:w-28" title={item.value}>{item.value}</span>
            <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
              <div className="h-full rounded" style={{ width: `${(item.total / max) * 100}%`, backgroundColor: SEQUENTIAL }} />
            </div>
            <span className="w-8 shrink-0 text-right text-xs font-medium">{item.total}</span>
          </button>
        ))}
      </div>
    </ChartCard>
  );
};
