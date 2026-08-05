import { pool } from '../db/pool';

export interface KpiParams {
  from: string;
  to: string;
  dateField: 'lead_date' | 'created_at';
  agentId?: string;
  source?: string;
}

function dateCol(dateField: 'lead_date' | 'created_at'): string {
  return dateField === 'created_at' ? 'created_at' : 'lead_date';
}

function scopeClause(params: KpiParams, from: string, to: string): { where: string; values: unknown[] } {
  const values: unknown[] = [from, to];
  let where = `deleted_at IS NULL AND ${dateCol(params.dateField)} BETWEEN $1 AND $2`;
  if (params.agentId) {
    values.push(params.agentId);
    where += ` AND agent_id = $${values.length}`;
  }
  if (params.source) {
    values.push(params.source);
    where += ` AND source = $${values.length}`;
  }
  return { where, values };
}

/** Same-length window immediately preceding `from`, for the %-delta comparisons. */
function previousPeriod(from: string, to: string): { from: string; to: string } {
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  const durationMs = toMs - fromMs;
  return {
    from: new Date(fromMs - durationMs).toISOString(),
    to: new Date(fromMs - 1).toISOString(),
  };
}

interface ScorecardRow {
  total_leads: string;
  new_leads: string;
  contacted: string;
  site_visits_done: string;
  converted: string;
  closed_lost: string;
  junk: string;
  total_deal_value: string | null;
  avg_response_hours: string | null;
}

async function fetchScorecards(params: KpiParams, from: string, to: string): Promise<ScorecardRow> {
  const { where, values } = scopeClause(params, from, to);
  const { rows } = await pool.query<ScorecardRow>(
    `SELECT
       count(*) AS total_leads,
       count(*) FILTER (WHERE status = 'new') AS new_leads,
       count(*) FILTER (WHERE first_contacted_at IS NOT NULL) AS contacted,
       count(*) FILTER (WHERE status = 'site_visit_done') AS site_visits_done,
       count(*) FILTER (WHERE status = 'converted') AS converted,
       count(*) FILTER (WHERE status = 'closed_lost') AS closed_lost,
       count(*) FILTER (WHERE status = 'junk') AS junk,
       sum(deal_value) FILTER (WHERE status = 'converted') AS total_deal_value,
       avg(EXTRACT(EPOCH FROM (first_contacted_at - created_at)) / 3600.0) FILTER (WHERE first_contacted_at IS NOT NULL) AS avg_response_hours
     FROM leads
     WHERE ${where}`,
    values
  );
  return rows[0];
}

async function fetchDuplicatesBlocked(params: KpiParams, from: string, to: string): Promise<number> {
  const values: unknown[] = [from, to];
  let where = 'ld.created_at BETWEEN $1 AND $2';
  if (params.source) {
    values.push(params.source);
    where += ` AND ld.incoming_source = $${values.length}`;
  }
  const { rows } = await pool.query<{ count: string }>(`SELECT count(*) FROM lead_duplicates ld WHERE ${where}`, values);
  return Number(rows[0].count);
}

async function fetchFollowUpCounts(params: KpiParams): Promise<{ pending: number; overdue: number }> {
  const values: unknown[] = [];
  let extra = '';
  if (params.agentId) {
    values.push(params.agentId);
    extra += ` AND agent_id = $${values.length}`;
  }
  if (params.source) {
    values.push(params.source);
    extra += ` AND source = $${values.length}`;
  }
  const { rows } = await pool.query<{ pending: string; overdue: string }>(
    `SELECT
       count(*) FILTER (WHERE next_follow_up_at IS NOT NULL AND status NOT IN ('converted','closed_lost','junk')) AS pending,
       count(*) FILTER (WHERE next_follow_up_at < now() AND status NOT IN ('converted','closed_lost','junk')) AS overdue
     FROM leads
     WHERE deleted_at IS NULL${extra}`,
    values
  );
  return { pending: Number(rows[0].pending), overdue: Number(rows[0].overdue) };
}

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 1000) / 10 : 0;
}

function delta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function toScoreSet(row: ScorecardRow, duplicatesBlocked: number) {
  const total = Number(row.total_leads);
  const converted = Number(row.converted);
  const closedLost = Number(row.closed_lost);
  return {
    totalLeads: total,
    newLeads: Number(row.new_leads),
    contacted: Number(row.contacted),
    siteVisitsDone: Number(row.site_visits_done),
    converted,
    conversionRate: pct(converted, total),
    closedLost,
    lossRate: pct(closedLost, total),
    junk: Number(row.junk),
    duplicatesBlocked,
    totalDealValue: Number(row.total_deal_value ?? 0),
    avgResponseHours: row.avg_response_hours ? Math.round(Number(row.avg_response_hours) * 10) / 10 : null,
  };
}

export async function getScorecards(params: KpiParams) {
  const prev = previousPeriod(params.from, params.to);
  const [current, previous, dupCurrent, dupPrev, followUps] = await Promise.all([
    fetchScorecards(params, params.from, params.to),
    fetchScorecards(params, prev.from, prev.to),
    fetchDuplicatesBlocked(params, params.from, params.to),
    fetchDuplicatesBlocked(params, prev.from, prev.to),
    fetchFollowUpCounts(params),
  ]);

  const cur = toScoreSet(current, dupCurrent);
  const prv = toScoreSet(previous, dupPrev);

  return {
    current: cur,
    deltas: {
      totalLeads: delta(cur.totalLeads, prv.totalLeads),
      newLeads: delta(cur.newLeads, prv.newLeads),
      contacted: delta(cur.contacted, prv.contacted),
      siteVisitsDone: delta(cur.siteVisitsDone, prv.siteVisitsDone),
      converted: delta(cur.converted, prv.converted),
      closedLost: delta(cur.closedLost, prv.closedLost),
      junk: delta(cur.junk, prv.junk),
      duplicatesBlocked: delta(cur.duplicatesBlocked, prv.duplicatesBlocked),
      totalDealValue: delta(cur.totalDealValue, prv.totalDealValue),
    },
    followUps,
  };
}

export async function getSourceBreakdown(params: KpiParams) {
  const { where, values } = scopeClause(params, params.from, params.to);
  const { rows } = await pool.query(
    `SELECT source,
            count(*) AS total,
            count(*) FILTER (WHERE status = 'converted') AS converted
     FROM leads
     WHERE ${where}
     GROUP BY source
     ORDER BY total DESC`,
    values
  );
  return rows.map((r) => ({
    source: r.source,
    total: Number(r.total),
    converted: Number(r.converted),
    conversionRate: pct(Number(r.converted), Number(r.total)),
  }));
}

export async function getTimeSeries(params: KpiParams) {
  const fromMs = new Date(params.from).getTime();
  const toMs = new Date(params.to).getTime();
  const days = (toMs - fromMs) / 86_400_000;
  const granularity = days <= 31 ? 'day' : days <= 186 ? 'week' : 'month';

  const { where, values } = scopeClause(params, params.from, params.to);
  const { rows } = await pool.query(
    `SELECT date_trunc('${granularity}', ${dateCol(params.dateField)}) AS bucket, count(*) AS total
     FROM leads
     WHERE ${where}
     GROUP BY bucket
     ORDER BY bucket ASC`,
    values
  );
  return { granularity, series: rows.map((r) => ({ bucket: r.bucket, total: Number(r.total) })) };
}

const FUNNEL_STAGES = ['new', 'contacted', 'site_visit_scheduled', 'negotiation', 'converted'] as const;

export async function getFunnel(params: KpiParams) {
  // "Reached this stage" = current status is this stage or any later one in
  // the pipeline (closed_lost/junk leads are excluded from later stages —
  // they only count toward whichever stage they reached before exiting,
  // approximated here by their status_change history).
  const { where, values } = scopeClause(params, params.from, params.to);
  const { rows } = await pool.query<{ status: string; count: string }>(
    `SELECT status, count(*) AS count FROM leads WHERE ${where} GROUP BY status`,
    values
  );
  const byStatus = new Map(rows.map((r) => [r.status, Number(r.count)]));

  // Everyone still "at" a later real stage implies they passed through the
  // earlier ones too; sum forward across the defined funnel order.
  const order = ['new', 'contacted', 'follow_up', 'site_visit_scheduled', 'site_visit_done', 'negotiation', 'converted'];
  const stageIndex = new Map(order.map((s, i) => [s, i]));

  const reached = FUNNEL_STAGES.map((stage) => {
    const minIndex = stageIndex.get(stage)!;
    let count = 0;
    for (const [status, n] of byStatus) {
      const idx = stageIndex.get(status);
      if (idx !== undefined && idx >= minIndex) count += n;
      // converted/closed_lost/junk leads that passed through earlier stages
      // are covered by idx>=minIndex once status reaches 'converted'; leads
      // that exited via closed_lost/junk are not attributed further stages
      // beyond 'new' here since we don't have per-stage exit tracking.
    }
    if (stage === 'converted') count = byStatus.get('converted') ?? 0;
    return { stage, count };
  });

  return reached.map((r, i) => ({
    ...r,
    dropOffPct: i === 0 ? 0 : pct(reached[i - 1].count - r.count, reached[i - 1].count || 1),
  }));
}

async function topDistinct(column: string, params: KpiParams) {
  const { where, values } = scopeClause(params, params.from, params.to);
  const { rows } = await pool.query(
    `SELECT ${column} AS value, count(*) AS total
     FROM leads
     WHERE ${where} AND ${column} IS NOT NULL
     GROUP BY ${column}
     ORDER BY total DESC
     LIMIT 10`,
    values
  );
  return rows.map((r) => ({ value: r.value, total: Number(r.total) }));
}

export async function getTopCities(params: KpiParams) {
  return topDistinct('city', params);
}
export async function getTopLocalities(params: KpiParams) {
  return topDistinct('locality', params);
}
export async function getTopProjects(params: KpiParams) {
  return topDistinct('project_name', params);
}

export async function getListingTypeSplit(params: KpiParams) {
  const { where, values } = scopeClause(params, params.from, params.to);
  const { rows } = await pool.query(
    `SELECT listing_type AS value, count(*) AS total FROM leads WHERE ${where} AND listing_type IS NOT NULL GROUP BY listing_type ORDER BY total DESC`,
    values
  );
  return rows.map((r) => ({ value: r.value, total: Number(r.total) }));
}

export async function getBhkDistribution(params: KpiParams) {
  const { where, values } = scopeClause(params, params.from, params.to);
  const { rows } = await pool.query(
    `SELECT bedrooms AS value, count(*) AS total FROM leads WHERE ${where} AND bedrooms IS NOT NULL GROUP BY bedrooms ORDER BY bedrooms ASC`,
    values
  );
  return rows.map((r) => ({ value: r.value, total: Number(r.total) }));
}

export async function getKpis(params: KpiParams) {
  const [scorecards, bySource, timeSeries, funnel, topCities, topLocalities, topProjects, listingTypeSplit, bhkDistribution] =
    await Promise.all([
      getScorecards(params),
      getSourceBreakdown(params),
      getTimeSeries(params),
      getFunnel(params),
      getTopCities(params),
      getTopLocalities(params),
      getTopProjects(params),
      getListingTypeSplit(params),
      getBhkDistribution(params),
    ]);
  return { scorecards, bySource, timeSeries, funnel, topCities, topLocalities, topProjects, listingTypeSplit, bhkDistribution };
}

// ------------------------------------------------------------ leaderboard ---

export async function getAgentLeaderboard(params: Omit<KpiParams, 'agentId'>) {
  const values: unknown[] = [params.from, params.to];
  let where = `l.deleted_at IS NULL AND l.${dateCol(params.dateField)} BETWEEN $1 AND $2`;
  if (params.source) {
    values.push(params.source);
    where += ` AND l.source = $${values.length}`;
  }

  const { rows } = await pool.query(
    `SELECT
       a.id AS agent_id, a.name AS agent_name,
       count(l.id) AS total,
       count(l.id) FILTER (WHERE l.status = 'new') AS new_leads,
       count(l.id) FILTER (WHERE l.first_contacted_at IS NOT NULL) AS contacted,
       count(l.id) FILTER (WHERE l.status = 'site_visit_done') AS site_visits,
       count(l.id) FILTER (WHERE l.status = 'converted') AS converted,
       count(l.id) FILTER (WHERE l.status = 'closed_lost') AS lost,
       avg(EXTRACT(EPOCH FROM (l.first_contacted_at - l.created_at)) / 3600.0) FILTER (WHERE l.first_contacted_at IS NOT NULL) AS avg_response_hours,
       count(l.id) FILTER (WHERE l.next_follow_up_at < now() AND l.status NOT IN ('converted','closed_lost','junk')) AS overdue_follow_ups,
       sum(l.deal_value) FILTER (WHERE l.status = 'converted') AS deal_value
     FROM agents a
     LEFT JOIN leads l ON l.agent_id = a.id AND ${where}
     WHERE a.is_active = true
     GROUP BY a.id, a.name
     ORDER BY total DESC`,
    values
  );

  return rows.map((r) => ({
    agentId: r.agent_id,
    agentName: r.agent_name,
    total: Number(r.total),
    newLeads: Number(r.new_leads),
    contacted: Number(r.contacted),
    siteVisits: Number(r.site_visits),
    converted: Number(r.converted),
    conversionRate: pct(Number(r.converted), Number(r.total)),
    lost: Number(r.lost),
    avgResponseHours: r.avg_response_hours ? Math.round(Number(r.avg_response_hours) * 10) / 10 : null,
    overdueFollowUps: Number(r.overdue_follow_ups),
    dealValue: Number(r.deal_value ?? 0),
  }));
}

export async function getAgentSourceCrosstab(params: Omit<KpiParams, 'agentId' | 'source'>) {
  const { rows } = await pool.query(
    `SELECT
       a.id AS agent_id, a.name AS agent_name, l.source,
       count(l.id) AS total,
       count(l.id) FILTER (WHERE l.status = 'converted') AS converted
     FROM agents a
     JOIN leads l ON l.agent_id = a.id AND l.deleted_at IS NULL AND l.${dateCol(params.dateField)} BETWEEN $1 AND $2
     WHERE a.is_active = true
     GROUP BY a.id, a.name, l.source
     ORDER BY a.name, l.source`,
    [params.from, params.to]
  );
  return rows.map((r) => ({
    agentId: r.agent_id,
    agentName: r.agent_name,
    source: r.source,
    total: Number(r.total),
    converted: Number(r.converted),
  }));
}
