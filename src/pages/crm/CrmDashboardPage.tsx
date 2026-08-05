import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
} from 'recharts';
import { ArrowDown, ArrowUp, AlertCircle } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../app/components/ui/table';
import { getAgentLeaderboard, getKpis } from '../../services/crmApi';
import { AgentLeaderboardRow, KpiResponse, LeadFiltersState } from '../../types/crm';
import { CATEGORICAL, SEQUENTIAL, STATUS, SOURCE_COLOR } from '../../app/components/crm/kpiPalette';
import { TodaysCallsPanel } from '../../app/components/crm/TodaysCallsPanel';
import { DateRangePicker } from '../../app/components/crm/DateRangePicker';
import { useDateRangeState } from '../../app/components/crm/useDateRangeState';

interface CrmDashboardPageProps {
  onDrillDown: (filters: LeadFiltersState) => void;
}

const GOOD_UP = new Set(['totalLeads', 'contacted', 'siteVisitsDone', 'converted', 'totalDealValue']);
const GOOD_DOWN = new Set(['closedLost', 'junk', 'duplicatesBlocked']);

const DeltaBadge: React.FC<{ metric: string; delta: number | null }> = ({ metric, delta }) => {
  if (delta === null) return null;
  const isGoodDirection = GOOD_UP.has(metric) ? delta >= 0 : GOOD_DOWN.has(metric) ? delta <= 0 : delta >= 0;
  const color = isGoodDirection ? STATUS.good : STATUS.critical;
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium" style={{ color }}>
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
    onClick={onClick}
    disabled={!onClick}
    className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-shadow ${onClick ? 'cursor-pointer hover:shadow-md' : 'cursor-default'} ${danger ? 'border-red-200 bg-red-50' : 'bg-white'}`}
  >
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold text-gray-900">{value}</span>
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

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getKpis({ ...period, dateField }),
      getAgentLeaderboard({ ...period, dateField }),
    ])
      .then(([kpis, agents]) => {
        setData(kpis);
        setLeaderboard(agents.leaderboard);
      })
      .catch(() => toast.error('Could not load dashboard data.'))
      .finally(() => setLoading(false));
  }, [period.from, period.to, dateField]);

  const drill = (extra: LeadFiltersState) => onDrillDown({ dateField, dateFrom: period.from, dateTo: period.to, ...extra });

  if (loading || !data) {
    return <div className="py-16 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  const { current, deltas, followUps } = data.scorecards;

  return (
    <div className="space-y-6">
      <DateRangePicker state={rangeState} range={period} onUpdate={updateRange} />

      <TodaysCallsPanel onViewAll={() => onDrillDown({ followUp: 'overdue' })} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Leads" value={current.totalLeads} metricKey="totalLeads" delta={deltas.totalLeads} onClick={() => drill({})} />
        <StatCard label="New Leads" value={current.newLeads} metricKey="newLeads" delta={deltas.newLeads} onClick={() => drill({ status: ['new'] })} />
        <StatCard label="Contacted" value={current.contacted} metricKey="contacted" delta={deltas.contacted} onClick={() => drill({})} />
        <StatCard label="Site Visits Done" value={current.siteVisitsDone} metricKey="siteVisitsDone" delta={deltas.siteVisitsDone} onClick={() => drill({ status: ['site_visit_done'] })} />
        <StatCard label="Converted" value={`${current.converted} (${current.conversionRate}%)`} metricKey="converted" delta={deltas.converted} onClick={() => drill({ status: ['converted'] })} />
        <StatCard label="Closed / Lost" value={`${current.closedLost} (${current.lossRate}%)`} metricKey="closedLost" delta={deltas.closedLost} onClick={() => drill({ status: ['closed_lost'] })} />
        <StatCard label="Junk" value={current.junk} metricKey="junk" delta={deltas.junk} onClick={() => drill({ status: ['junk'] })} />
        <StatCard label="Duplicates Blocked" value={current.duplicatesBlocked} metricKey="duplicatesBlocked" delta={deltas.duplicatesBlocked} onClick={() => drill({ isDuplicate: true })} />
        <StatCard label="Total Deal Value" value={`₹${current.totalDealValue.toLocaleString('en-IN')}`} metricKey="totalDealValue" delta={deltas.totalDealValue} onClick={() => drill({ status: ['converted'] })} />
        <StatCard label="Avg. Response Time" value={current.avgResponseHours !== null ? `${current.avgResponseHours}h` : '—'} />
        <StatCard label="Pending Follow-ups" value={followUps.pending} onClick={() => drill({ followUp: 'this_week' })} />
        <StatCard label="Overdue Follow-ups" value={followUps.overdue} danger onClick={() => drill({ followUp: 'overdue' })} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Leads by Source">
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
              <Tooltip formatter={(value: number, _name, props: any) => [`${value} leads (${props.payload.conversionRate}% converted)`, props.payload.source]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Leads Over Time">
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

        <ChartCard title="Pipeline Funnel">
          <div className="space-y-2 py-2">
            {data.funnel.map((stage) => (
              <button
                key={stage.stage}
                onClick={() => drill({ status: [stage.stage] })}
                className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left hover:bg-accent"
              >
                <div className="w-32 shrink-0 text-xs capitalize text-muted-foreground">{stage.stage.replace(/_/g, ' ')}</div>
                <div className="h-6 flex-1 overflow-hidden rounded bg-muted">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${Math.max(4, (stage.count / (data.funnel[0].count || 1)) * 100)}%`,
                      backgroundColor: SEQUENTIAL,
                    }}
                  />
                </div>
                <div className="w-16 shrink-0 text-right text-sm font-medium">{stage.count}</div>
                {stage.dropOffPct > 0 && <div className="w-16 shrink-0 text-right text-xs text-muted-foreground">-{stage.dropOffPct}%</div>}
              </button>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Rent vs Sale Split">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.listingTypeSplit} dataKey="total" nameKey="value" cx="50%" cy="50%" outerRadius={80} onClick={() => drill({})} cursor="pointer">
                {data.listingTypeSplit.map((entry, i) => (
                  <Cell key={entry.value} fill={CATEGORICAL[i % CATEGORICAL.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <TopListCard title="Leads by City (Top 10)" items={data.topCities} onClick={(v) => drill({ city: [v] })} />
        <TopListCard title="Leads by Project (Top 10)" items={data.topProjects} onClick={(v) => drill({ project: [v] })} />

        <ChartCard title="BHK Distribution">
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
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Agent Leaderboard</h2>
        <div className="overflow-x-auto rounded-xl border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
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

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-xl border bg-white p-4">
    <h3 className="mb-2 text-sm font-semibold text-gray-900">{title}</h3>
    {children}
  </div>
);

const TopListCard: React.FC<{ title: string; items: { value: string; total: number }[]; onClick: (value: string) => void }> = ({ title, items, onClick }) => {
  const max = Math.max(1, ...items.map((i) => i.total));
  return (
    <ChartCard title={title}>
      <div className="space-y-1.5 py-1">
        {items.length === 0 && <p className="text-xs text-muted-foreground">No data.</p>}
        {items.map((item) => (
          <button key={item.value} onClick={() => onClick(item.value)} className="flex w-full items-center gap-2 rounded p-1 text-left hover:bg-accent">
            <span className="w-28 shrink-0 truncate text-xs">{item.value}</span>
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
