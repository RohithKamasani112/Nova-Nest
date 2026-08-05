import { pool, withTransaction } from '../db/pool';
import { cleanCell, collapseWhitespace } from '../lib/textUtils';
import { normalizeEmail, normalizeName, normalizeNameKey, normalizePhone } from '../lib/valueNormalize';
import { resolveMapping } from '../parsers/rowMapper';
import { CrmSource } from '../types/crm';

export interface LeadFilters {
  source?: string[];
  agentId?: string[]; // 'unassigned' is a sentinel for agent_id IS NULL
  status?: string[];
  subStatus?: string;
  city?: string[];
  locality?: string[];
  project?: string[];
  listingType?: string[];
  propertyType?: string;
  bhk?: number[];
  priceMin?: number;
  priceMax?: number;
  leadType?: string;
  search?: string;
  dateField?: 'lead_date' | 'created_at';
  dateFrom?: string;
  dateTo?: string;
  followUp?: 'due_today' | 'overdue' | 'this_week' | 'none';
  hasPhone?: boolean;
  hasEmail?: boolean;
  isDuplicate?: boolean;
  multiPortal?: boolean;
  neverContacted?: boolean;
  contacted?: boolean;
  noFollowUpSet?: boolean;
  batchId?: string;
}

const TERMINAL_STATUSES = "('converted','closed_lost','junk')";

export interface SortOptions {
  sortBy?: 'lead_date' | 'created_at' | 'name' | 'price_value' | 'next_follow_up_at' | 'updated_at';
  sortDir?: 'asc' | 'desc';
}

const SORT_COLUMN: Record<string, string> = {
  lead_date: 'l.lead_date',
  created_at: 'l.created_at',
  name: 'l.name',
  price_value: 'l.price_value',
  next_follow_up_at: 'l.next_follow_up_at',
  updated_at: 'l.updated_at',
};

function buildWhere(filters: LeadFilters): { where: string; params: unknown[] } {
  const clauses: string[] = ['l.deleted_at IS NULL'];
  const params: unknown[] = [];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };

  if (filters.source?.length) clauses.push(`l.source = ANY(${p(filters.source)})`);

  if (filters.agentId?.length) {
    const real = filters.agentId.filter((a) => a !== 'unassigned');
    const wantsUnassigned = filters.agentId.includes('unassigned');
    const sub: string[] = [];
    if (real.length) sub.push(`l.agent_id = ANY(${p(real)})`);
    if (wantsUnassigned) sub.push('l.agent_id IS NULL');
    if (sub.length) clauses.push(`(${sub.join(' OR ')})`);
  }

  if (filters.status?.length) clauses.push(`l.status = ANY(${p(filters.status)})`);
  if (filters.subStatus) clauses.push(`l.sub_status = ${p(filters.subStatus)}`);
  if (filters.city?.length) clauses.push(`l.city = ANY(${p(filters.city)})`);
  if (filters.locality?.length) clauses.push(`l.locality = ANY(${p(filters.locality)})`);
  if (filters.project?.length) clauses.push(`l.project_name = ANY(${p(filters.project)})`);
  if (filters.listingType?.length) clauses.push(`l.listing_type = ANY(${p(filters.listingType)})`);
  if (filters.propertyType) clauses.push(`l.property_type = ${p(filters.propertyType)}`);
  if (filters.bhk?.length) clauses.push(`l.bedrooms = ANY(${p(filters.bhk)})`);
  if (filters.priceMin !== undefined) clauses.push(`l.price_value >= ${p(filters.priceMin)}`);
  if (filters.priceMax !== undefined) clauses.push(`l.price_value <= ${p(filters.priceMax)}`);
  if (filters.leadType) clauses.push(`l.lead_type = ${p(filters.leadType)}`);
  if (filters.batchId) clauses.push(`l.batch_id = ${p(filters.batchId)}`);

  if (filters.search) {
    const digits = filters.search.replace(/\D/g, '');
    const term = `%${filters.search.toLowerCase()}%`;
    const idx = p(term);
    const searchClauses = [
      `lower(l.name) LIKE ${idx}`,
      `lower(l.email) LIKE ${idx}`,
      `lower(coalesce(l.project_name, '')) LIKE ${idx}`,
      `l.phone_raw LIKE ${p(`%${filters.search}%`)}`,
    ];
    if (digits.length >= 3) searchClauses.push(`l.phone LIKE ${p(`%${digits}%`)}`);
    clauses.push(`(${searchClauses.join(' OR ')})`);
  }

  const dateCol = filters.dateField === 'created_at' ? 'l.created_at' : 'l.lead_date';
  if (filters.dateFrom) clauses.push(`${dateCol} >= ${p(filters.dateFrom)}`);
  if (filters.dateTo) clauses.push(`${dateCol} <= ${p(filters.dateTo)}`);

  if (filters.followUp === 'due_today') {
    clauses.push(`l.next_follow_up_at::date = current_date`);
  } else if (filters.followUp === 'overdue') {
    clauses.push(`l.next_follow_up_at < now() AND l.status NOT IN ${TERMINAL_STATUSES}`);
  } else if (filters.followUp === 'this_week') {
    clauses.push(`l.next_follow_up_at BETWEEN now() AND now() + interval '7 days'`);
  } else if (filters.followUp === 'none') {
    clauses.push(`l.next_follow_up_at IS NULL`);
  }

  if (filters.hasPhone) clauses.push('l.phone IS NOT NULL');
  if (filters.hasEmail) clauses.push('l.email IS NOT NULL');
  if (filters.isDuplicate) clauses.push('l.is_duplicate = true');
  if (filters.neverContacted) clauses.push('l.first_contacted_at IS NULL');
  if (filters.contacted) clauses.push('l.first_contacted_at IS NOT NULL');
  if (filters.noFollowUpSet) clauses.push(`l.next_follow_up_at IS NULL AND l.status NOT IN ${TERMINAL_STATUSES}`);
  if (filters.multiPortal) {
    clauses.push('EXISTS (SELECT 1 FROM lead_duplicates ld WHERE ld.existing_lead_id = l.id)');
  }

  return { where: clauses.join(' AND '), params };
}

export interface LeadListItem {
  id: string;
  source: string;
  name: string;
  phone: string | null;
  email: string | null;
  project_name: string | null;
  locality: string | null;
  city: string | null;
  property_type: string | null;
  listing_type: string | null;
  configuration: string | null;
  price_value: string | null;
  agent_id: string | null;
  agent_name: string | null;
  status: string;
  lead_date: Date | null;
  next_follow_up_at: Date | null;
  last_activity_at: Date | null;
  last_activity_type: string | null;
  other_interest_count: number;
  updated_at: Date;
}

export async function listLeads(
  filters: LeadFilters,
  sort: SortOptions,
  page: number,
  pageSize: number
): Promise<{ leads: LeadListItem[]; total: number }> {
  const { where, params } = buildWhere(filters);
  const sortCol = SORT_COLUMN[sort.sortBy ?? 'created_at'] ?? 'l.created_at';
  const sortDir = sort.sortDir === 'asc' ? 'ASC' : 'DESC';

  const listParams = [...params, pageSize, (page - 1) * pageSize];
  const listQuery = `
    SELECT l.id, l.source, l.name, l.phone, l.email, l.project_name, l.locality, l.city,
           l.property_type, l.listing_type, l.configuration,
           l.price_value, l.agent_id, a.name AS agent_name, l.status, l.lead_date, l.next_follow_up_at,
           la.occurred_at AS last_activity_at, la.type AS last_activity_type, l.updated_at,
           (SELECT count(*)::int FROM lead_duplicates ld WHERE ld.existing_lead_id = l.id AND ld.matched_on = 'phone') AS other_interest_count
    FROM leads l
    LEFT JOIN agents a ON a.id = l.agent_id
    LEFT JOIN LATERAL (
      SELECT occurred_at, type FROM lead_activities WHERE lead_id = l.id ORDER BY occurred_at DESC LIMIT 1
    ) la ON true
    WHERE ${where}
    ORDER BY ${sortCol} ${sortDir} NULLS LAST
    LIMIT $${listParams.length - 1} OFFSET $${listParams.length}
  `;
  const countQuery = `SELECT count(*) FROM leads l WHERE ${where}`;

  const [listResult, countResult] = await Promise.all([
    pool.query<LeadListItem>(listQuery, listParams),
    pool.query<{ count: string }>(countQuery, params),
  ]);

  return { leads: listResult.rows, total: Number(countResult.rows[0].count) };
}

export interface ChipCounts {
  needsContact: number;
  contacted: number;
  dueToday: number;
  overdue: number;
  noFollowUpSet: number;
  unassigned: number;
  converted: number;
  lost: number;
}

export async function getChipCounts(): Promise<ChipCounts> {
  const { rows } = await pool.query<Record<keyof ChipCounts, string>>(
    `SELECT
       count(*) FILTER (WHERE status = 'new' AND first_contacted_at IS NULL) AS "needsContact",
       count(*) FILTER (WHERE first_contacted_at IS NOT NULL) AS contacted,
       count(*) FILTER (WHERE next_follow_up_at::date = current_date) AS "dueToday",
       count(*) FILTER (WHERE next_follow_up_at < now() AND status NOT IN ${TERMINAL_STATUSES}) AS overdue,
       count(*) FILTER (WHERE next_follow_up_at IS NULL AND status NOT IN ${TERMINAL_STATUSES}) AS "noFollowUpSet",
       count(*) FILTER (WHERE agent_id IS NULL) AS unassigned,
       count(*) FILTER (WHERE status = 'converted') AS converted,
       count(*) FILTER (WHERE status = 'closed_lost') AS lost
     FROM leads WHERE deleted_at IS NULL`
  );
  const r = rows[0];
  return {
    needsContact: Number(r.needsContact),
    contacted: Number(r.contacted),
    dueToday: Number(r.dueToday),
    overdue: Number(r.overdue),
    noFollowUpSet: Number(r.noFollowUpSet),
    unassigned: Number(r.unassigned),
    converted: Number(r.converted),
    lost: Number(r.lost),
  };
}

export async function getTodaysCalls(agentId?: string): Promise<{ overdue: LeadListItem[]; dueToday: LeadListItem[] }> {
  const baseFilters: LeadFilters = agentId ? { agentId: [agentId] } : {};
  const sort: SortOptions = { sortBy: 'next_follow_up_at', sortDir: 'asc' };
  const [overdue, dueToday] = await Promise.all([
    listLeads({ ...baseFilters, followUp: 'overdue' }, sort, 1, 200),
    listLeads({ ...baseFilters, followUp: 'due_today' }, sort, 1, 200),
  ]);
  return { overdue: overdue.leads, dueToday: dueToday.leads };
}

export async function exportLeadsCsv(filters: LeadFilters, sort: SortOptions): Promise<string> {
  const { where, params } = buildWhere(filters);
  const sortCol = SORT_COLUMN[sort.sortBy ?? 'created_at'] ?? 'l.created_at';
  const sortDir = sort.sortDir === 'asc' ? 'ASC' : 'DESC';

  const { rows } = await pool.query(
    `SELECT l.name, l.phone, l.email, l.source, l.project_name, l.locality, l.city, l.configuration,
            l.price_value, l.listing_type, a.name AS agent_name, l.status, l.lead_date, l.created_at,
            l.next_follow_up_at, l.notes
     FROM leads l
     LEFT JOIN agents a ON a.id = l.agent_id
     WHERE ${where}
     ORDER BY ${sortCol} ${sortDir} NULLS LAST
     LIMIT 20000`,
    params
  );

  const headers = ['Name', 'Phone', 'Email', 'Source', 'Project', 'Locality', 'City', 'Configuration', 'Price', 'Listing Type', 'Agent', 'Status', 'Lead Date', 'Created At', 'Next Follow-up', 'Notes'];
  const csvEscape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : v instanceof Date ? v.toISOString() : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.map(csvEscape).join(','),
    ...rows.map((r) =>
      [r.name, r.phone, r.email, r.source, r.project_name, r.locality, r.city, r.configuration, r.price_value, r.listing_type, r.agent_name, r.status, r.lead_date, r.created_at, r.next_follow_up_at, r.notes]
        .map(csvEscape)
        .join(',')
    ),
  ];
  return lines.join('\r\n');
}

export interface FilterOptionCount {
  value: string;
  count: number;
}

export interface FilterOptions {
  sources: string[];
  statuses: { value: string; label: string; count: number }[];
  agents: { id: string; name: string; count: number }[];
  cities: FilterOptionCount[];
  localities: FilterOptionCount[];
  projects: FilterOptionCount[];
  propertyTypes: FilterOptionCount[];
  bhk: string[];
  listingTypes: string[];
}

// Static enums — rendered regardless of what's in the DB, so Source/Status
// still show their full option list on an empty table.
export const SOURCE_VALUES = ['housing', 'magicbricks', '99acres', 'personal'];
export const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'site_visit_scheduled', label: 'Site Visit Scheduled' },
  { value: 'site_visit_done', label: 'Site Visit Done' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'converted', label: 'Converted' },
  { value: 'closed_lost', label: 'Closed / Lost' },
  { value: 'junk', label: 'Junk' },
];
const LISTING_TYPE_VALUES = ['rent', 'sale', 'resale', 'pg', 'commercial', 'other'];

const FILTER_OPTIONS_TTL_MS = 5 * 60 * 1000;
let filterOptionsCache: { data: FilterOptions; expiresAt: number } | null = null;

async function loadFilterOptions(): Promise<FilterOptions> {
  const [statusCounts, agents, cities, localities, projects, propertyTypes, bhk] = await Promise.all([
    pool.query<{ status: string; count: string }>(
      `SELECT status, count(*) FROM leads WHERE deleted_at IS NULL GROUP BY status`
    ),
    pool.query<{ id: string; name: string; count: string }>(
      `SELECT a.id, a.name, count(l.id) AS count
       FROM agents a
       LEFT JOIN leads l ON l.agent_id = a.id AND l.deleted_at IS NULL
       WHERE a.is_active = true
       GROUP BY a.id, a.name
       ORDER BY a.name
       LIMIT 1000`
    ),
    pool.query<{ value: string; count: string }>(
      `SELECT city AS value, count(*) FROM leads WHERE city IS NOT NULL AND deleted_at IS NULL
       GROUP BY city ORDER BY count(*) DESC LIMIT 1000`
    ),
    pool.query<{ value: string; count: string }>(
      `SELECT locality AS value, count(*) FROM leads WHERE locality IS NOT NULL AND deleted_at IS NULL
       GROUP BY locality ORDER BY count(*) DESC LIMIT 1000`
    ),
    pool.query<{ value: string; count: string }>(
      `SELECT project_name AS value, count(*) FROM leads WHERE project_name IS NOT NULL AND deleted_at IS NULL
       GROUP BY project_name ORDER BY count(*) DESC LIMIT 1000`
    ),
    pool.query<{ value: string; count: string }>(
      `SELECT property_type AS value, count(*) FROM leads WHERE property_type IS NOT NULL AND deleted_at IS NULL
       GROUP BY property_type ORDER BY count(*) DESC LIMIT 1000`
    ),
    pool.query<{ configuration: string; count: string }>(
      `SELECT configuration, count(*) FROM leads WHERE configuration IS NOT NULL AND deleted_at IS NULL
       GROUP BY configuration ORDER BY count(*) DESC LIMIT 50`
    ),
  ]);

  const statusCountMap = new Map(statusCounts.rows.map((r) => [r.status, Number(r.count)]));

  return {
    sources: SOURCE_VALUES,
    statuses: STATUS_OPTIONS.map((s) => ({ ...s, count: statusCountMap.get(s.value) ?? 0 })),
    agents: agents.rows.map((r) => ({ id: r.id, name: r.name, count: Number(r.count) })),
    cities: cities.rows.map((r) => ({ value: r.value, count: Number(r.count) })),
    localities: localities.rows.map((r) => ({ value: r.value, count: Number(r.count) })),
    projects: projects.rows.map((r) => ({ value: r.value, count: Number(r.count) })),
    propertyTypes: propertyTypes.rows.map((r) => ({ value: r.value, count: Number(r.count) })),
    bhk: bhk.rows.map((r) => r.configuration),
    listingTypes: LISTING_TYPE_VALUES,
  };
}

export async function getFilterOptions(): Promise<FilterOptions> {
  if (filterOptionsCache && filterOptionsCache.expiresAt > Date.now()) {
    return filterOptionsCache.data;
  }
  const data = await loadFilterOptions();
  filterOptionsCache = { data, expiresAt: Date.now() + FILTER_OPTIONS_TTL_MS };
  return data;
}

// ------------------------------------------------------------- detail ---

export class LeadNotFoundError extends Error {
  constructor() {
    super('Lead not found.');
    this.name = 'LeadNotFoundError';
  }
}

export async function getLeadDetail(id: string) {
  const { rows } = await pool.query('SELECT l.*, a.name AS agent_name FROM leads l LEFT JOIN agents a ON a.id = l.agent_id WHERE l.id = $1 AND l.deleted_at IS NULL', [id]);
  if (!rows[0]) throw new LeadNotFoundError();

  const [crossPortal, activities] = await Promise.all([
    pool.query(
      `SELECT ld.incoming_source, ld.matched_on, ld.created_at, ld.incoming_payload
       FROM lead_duplicates ld WHERE ld.existing_lead_id = $1 ORDER BY ld.created_at DESC`,
      [id]
    ),
    pool.query(
      `SELECT id, type, from_status, to_status, content, occurred_at, created_by
       FROM lead_activities WHERE lead_id = $1 ORDER BY occurred_at DESC LIMIT 100`,
      [id]
    ),
  ]);

  return { lead: rows[0], crossPortalEnquiries: crossPortal.rows, activities: activities.rows };
}

// The badge on the leads table ("this person also enquired about N other
// properties") is powered by the same lead_duplicates rows the import
// pipeline already writes on every phone match — no new data captured, just
// surfaced. incoming_payload stores the *original* spreadsheet row (raw
// header text varies per source/file), so recovering "which property" needs
// the same header->canonical mapping used at import time, run again here
// against that source's alias list.
function extractProjectName(source: string, payload: Record<string, unknown> | null): string | null {
  if (!payload || source === 'personal') return null;
  const headers = Object.keys(payload);
  if (headers.length === 0) return null;
  const mapping = resolveMapping(headers, source as CrmSource);
  const match = mapping.find((m) => m.canonicalField === 'project_name');
  if (!match) return null;
  const value = payload[match.header];
  return value === null || value === undefined || value === '' ? null : String(value);
}

export interface LeadInterest {
  source: string;
  createdAt: Date;
  projectName: string | null;
}

/** Detail behind the multi-interest badge — fetched lazily on click, not on every list row. */
export async function getLeadInterests(leadId: string): Promise<LeadInterest[]> {
  const { rows } = await pool.query<{ incoming_source: string; created_at: Date; incoming_payload: Record<string, unknown> }>(
    `SELECT incoming_source, created_at, incoming_payload
     FROM lead_duplicates WHERE existing_lead_id = $1 AND matched_on = 'phone'
     ORDER BY created_at DESC LIMIT 20`,
    [leadId]
  );
  return rows.map((r) => ({
    source: r.incoming_source,
    createdAt: r.created_at,
    projectName: extractProjectName(r.incoming_source, r.incoming_payload),
  }));
}

// ------------------------------------------------------- personal lead ---

export interface PersonalLeadInput {
  name: string;
  phone: string;
  altPhone?: string | null;
  email?: string | null;
  agentId?: string | null;
  leadDate?: string | null;
  sourceDetail?: string | null;
  listingType?: string | null;
  propertyType?: string | null;
  configuration?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  city?: string | null;
  locality?: string | null;
  project?: string | null;
  notes?: string | null;
  nextFollowUpAt?: string | null;
  status?: string;
  overrideDuplicateReason?: string | null;
  userId: string | null;
}

export async function checkDuplicateContact(phone?: string, email?: string) {
  if (!phone && !email) return null;
  const phoneResult = phone ? normalizePhone(phone) : null;
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (phoneResult?.phone) {
    params.push(phoneResult.phone);
    clauses.push(`phone = $${params.length}`);
  }
  if (email) {
    params.push(email.toLowerCase());
    clauses.push(`lower(email) = $${params.length}`);
  }
  if (clauses.length === 0) return null;

  const { rows } = await pool.query(
    `SELECT l.id, l.name, l.source, l.created_at FROM leads l
     WHERE deleted_at IS NULL AND is_duplicate = false AND (${clauses.join(' OR ')})
     ORDER BY created_at DESC LIMIT 1`,
    params
  );
  return rows[0] ?? null;
}

export async function createPersonalLead(input: PersonalLeadInput) {
  const name = normalizeName(input.name);
  if (!name) throw new Error('Name is required.');
  const phoneResult = normalizePhone(input.phone);
  const emailResult = input.email ? normalizeEmail(input.email) : { email: null };

  const { rows } = await pool.query(
    `INSERT INTO leads (
       source, name, name_normalized, phone, phone_raw, alt_phone, email, lead_date,
       listing_type, property_type, configuration, city, locality, project_name,
       notes, next_follow_up_at, agent_id, status, source_status, raw_data
     ) VALUES (
       'personal', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
     ) RETURNING id`,
    [
      name,
      normalizeNameKey(name),
      phoneResult.phone,
      phoneResult.phoneRaw,
      input.altPhone ?? null,
      emailResult.email,
      input.leadDate ?? new Date().toISOString(),
      input.listingType ?? null,
      cleanCell(input.propertyType),
      cleanCell(input.configuration),
      cleanCell(input.city),
      cleanCell(input.locality),
      cleanCell(input.project),
      cleanCell(input.notes),
      input.nextFollowUpAt ?? null,
      input.agentId ?? null,
      input.status ?? 'new',
      cleanCell(input.sourceDetail),
      JSON.stringify({
        priceMin: input.priceMin ?? null,
        priceMax: input.priceMax ?? null,
        overrideDuplicateReason: input.overrideDuplicateReason ?? null,
      }),
    ]
  );
  return rows[0].id as string;
}

// ------------------------------------------------------------- update ---

const STATUS_VALUES = STATUS_OPTIONS.map((s) => s.value);

export interface LeadUpdateInput {
  status?: string;
  agentId?: string | null;
  notes?: string | null;
  subStatus?: string | null;
  nextFollowUpAt?: string | null;
  lostReason?: string | null;
  dealValue?: number | null;
  userId: string | null;
}

export async function updateLead(id: string, patch: LeadUpdateInput) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (patch.userId) {
      await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', patch.userId]);
    }

    const { rows: existingRows } = await client.query('SELECT * FROM leads WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (!existingRows[0]) throw new LeadNotFoundError();
    const existing = existingRows[0];

    const sets: string[] = [];
    const params: unknown[] = [];
    const add = (col: string, value: unknown) => {
      params.push(value);
      sets.push(`${col} = $${params.length}`);
    };

    if (patch.status !== undefined) {
      if (!STATUS_VALUES.includes(patch.status)) throw new Error('INVALID_STATUS');
      add('status', patch.status);
      if (patch.status === 'contacted' && !existing.first_contacted_at) add('first_contacted_at', new Date());
      if (patch.status === 'converted' && !existing.converted_at) add('converted_at', new Date());
      if (patch.status === 'closed_lost') {
        if (!existing.closed_at) add('closed_at', new Date());
        if (!patch.lostReason && !existing.lost_reason) throw new Error('LOST_REASON_REQUIRED');
      }
    }
    if (patch.agentId !== undefined) add('agent_id', patch.agentId);
    if (patch.notes !== undefined) add('notes', patch.notes);
    if (patch.subStatus !== undefined) add('sub_status', patch.subStatus);
    if (patch.nextFollowUpAt !== undefined) add('next_follow_up_at', patch.nextFollowUpAt);
    if (patch.lostReason !== undefined) add('lost_reason', patch.lostReason);
    if (patch.dealValue !== undefined) add('deal_value', patch.dealValue);

    if (sets.length === 0) {
      await client.query('ROLLBACK');
      return existing;
    }

    params.push(id);
    const { rows } = await client.query(`UPDATE leads SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function softDeleteLead(id: string): Promise<void> {
  const { rowCount } = await pool.query('UPDATE leads SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL', [id]);
  if (!rowCount) throw new LeadNotFoundError();
}

export async function addLeadActivity(
  leadId: string,
  type: string,
  content: string | null,
  userId: string | null,
  // When provided, the activity insert and the leads.next_follow_up_at
  // update happen as one atomic write (e.g. "add a note and set the next
  // follow-up date" from the drawer) rather than two separate requests.
  nextFollowUpAt?: string | null
) {
  if (nextFollowUpAt === undefined) {
    const { rows } = await pool.query(
      `INSERT INTO lead_activities (lead_id, type, content, created_by) VALUES ($1, $2, $3, $4) RETURNING *`,
      [leadId, type, content, userId]
    );
    return rows[0];
  }

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO lead_activities (lead_id, type, content, created_by) VALUES ($1, $2, $3, $4) RETURNING *`,
      [leadId, type, content, userId]
    );
    await client.query(`UPDATE leads SET next_follow_up_at = $1 WHERE id = $2`, [nextFollowUpAt, leadId]);
    return rows[0];
  });
}

// --------------------------------------------------------------- bulk ---

export interface BulkActionInput {
  ids: string[];
  action: 'assign_agent' | 'change_status' | 'delete';
  payload?: { agentId?: string | null; status?: string; lostReason?: string };
  userId: string | null;
}

export async function bulkAction(input: BulkActionInput): Promise<{ affected: number }> {
  if (input.ids.length === 0) return { affected: 0 };

  if (input.action === 'assign_agent') {
    const { rowCount } = await pool.query(
      'UPDATE leads SET agent_id = $1 WHERE id = ANY($2) AND deleted_at IS NULL',
      [input.payload?.agentId ?? null, input.ids]
    );
    return { affected: rowCount ?? 0 };
  }

  if (input.action === 'change_status') {
    const status = input.payload?.status;
    if (!status || !STATUS_VALUES.includes(status)) throw new Error('INVALID_STATUS');

    // Bulk goes through the same per-lead stamping rules as a single update
    // (first_contacted_at / converted_at / closed_at, lost_reason required)
    // rather than a blind mass UPDATE — otherwise bulk-closing a batch as
    // "lost" could silently skip the reason requirement that a single
    // update enforces.
    if (status === 'closed_lost' && !input.payload?.lostReason) {
      // Only a hard requirement if at least one selected lead doesn't
      // already have a lost_reason from a prior transition.
      const { rows } = await pool.query('SELECT count(*) FROM leads WHERE id = ANY($1) AND lost_reason IS NULL', [input.ids]);
      if (Number(rows[0].count) > 0) throw new Error('LOST_REASON_REQUIRED');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (input.userId) await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', input.userId]);

      const sets = ['status = $1'];
      const params: unknown[] = [status];
      if (status === 'contacted') sets.push('first_contacted_at = COALESCE(first_contacted_at, now())');
      if (status === 'converted') sets.push('converted_at = COALESCE(converted_at, now())');
      if (status === 'closed_lost') {
        sets.push('closed_at = COALESCE(closed_at, now())');
        if (input.payload?.lostReason) {
          params.push(input.payload.lostReason);
          sets.push(`lost_reason = COALESCE(lost_reason, $${params.length})`);
        }
      }
      params.push(input.ids);
      const { rowCount } = await client.query(
        `UPDATE leads SET ${sets.join(', ')} WHERE id = ANY($${params.length}) AND deleted_at IS NULL`,
        params
      );
      await client.query('COMMIT');
      return { affected: rowCount ?? 0 };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  if (input.action === 'delete') {
    const { rowCount } = await pool.query('UPDATE leads SET deleted_at = now() WHERE id = ANY($1) AND deleted_at IS NULL', [input.ids]);
    return { affected: rowCount ?? 0 };
  }

  throw new Error('UNKNOWN_ACTION');
}

export { collapseWhitespace };
