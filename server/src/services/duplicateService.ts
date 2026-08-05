import { PoolClient } from 'pg';
import { CrmSource, MappedLead } from '../types/crm';

export type DbMatchKind = 'phone' | 'email' | 'source_property_name';

export interface DbMatch {
  id: string;
  matchedOn: DbMatchKind;
}

/**
 * DB-matching rules in priority order (spec §5.1): phone -> email ->
 * (source, external_property_id, normalized name). Fuzzy name matching
 * alone never triggers a match.
 */
export async function findExistingMatch(
  client: PoolClient,
  lead: MappedLead,
  source: CrmSource
): Promise<DbMatch | null> {
  if (lead.phone) {
    const r = await client.query<{ id: string }>(
      'SELECT id FROM leads WHERE phone = $1 AND deleted_at IS NULL AND is_duplicate = false LIMIT 1',
      [lead.phone]
    );
    if (r.rows[0]) return { id: r.rows[0].id, matchedOn: 'phone' };
  }

  if (lead.email) {
    const r = await client.query<{ id: string }>(
      'SELECT id FROM leads WHERE lower(email) = lower($1) AND deleted_at IS NULL AND is_duplicate = false LIMIT 1',
      [lead.email]
    );
    if (r.rows[0]) return { id: r.rows[0].id, matchedOn: 'email' };
  }

  if (lead.externalPropertyId && lead.nameNormalized) {
    const r = await client.query<{ id: string }>(
      `SELECT id FROM leads
       WHERE source = $1 AND external_property_id = $2 AND name_normalized = $3
         AND deleted_at IS NULL AND is_duplicate = false
       LIMIT 1`,
      [source, lead.externalPropertyId, lead.nameNormalized]
    );
    if (r.rows[0]) return { id: r.rows[0].id, matchedOn: 'source_property_name' };
  }

  return null;
}

/**
 * Chunk-level batch version of findExistingMatch: 1 query for the whole
 * chunk instead of up to 3 round trips per row. Returns rowNumber -> match,
 * applying the same phone -> email -> (source, extid, name) priority.
 */
export async function findExistingMatchesBatch(
  client: PoolClient,
  rows: { rowNumber: number; lead: MappedLead }[],
  source: CrmSource
): Promise<Map<number, DbMatch>> {
  const result = new Map<number, DbMatch>();

  const phones = Array.from(new Set(rows.filter((r) => r.lead.phone).map((r) => r.lead.phone!)));
  const emails = Array.from(new Set(rows.filter((r) => r.lead.email).map((r) => r.lead.email!.toLowerCase())));
  const extRows = rows.filter((r) => r.lead.externalPropertyId && r.lead.nameNormalized);
  const extIds = extRows.map((r) => r.lead.externalPropertyId!);
  const extNames = extRows.map((r) => r.lead.nameNormalized!);

  if (phones.length === 0 && emails.length === 0 && extIds.length === 0) return result;

  const { rows: dbRows } = await client.query<{
    id: string;
    phone: string | null;
    email: string | null;
    external_property_id: string | null;
    name_normalized: string;
  }>(
    `SELECT id, phone, lower(email) AS email, external_property_id, name_normalized
     FROM leads
     WHERE deleted_at IS NULL AND is_duplicate = false
       AND (
         phone = ANY($1::text[])
         OR lower(email) = ANY($2::text[])
         OR (source = $3 AND (external_property_id, name_normalized) IN (SELECT * FROM unnest($4::text[], $5::text[])))
       )`,
    [phones, emails, source, extIds, extNames]
  );

  const byPhone = new Map<string, string>();
  const byEmail = new Map<string, string>();
  const byExt = new Map<string, string>();
  for (const row of dbRows) {
    if (row.phone) byPhone.set(row.phone, row.id);
    if (row.email) byEmail.set(row.email, row.id);
    if (row.external_property_id) byExt.set(`${row.external_property_id}::${row.name_normalized}`, row.id);
  }

  for (const { rowNumber, lead } of rows) {
    if (lead.phone && byPhone.has(lead.phone)) {
      result.set(rowNumber, { id: byPhone.get(lead.phone)!, matchedOn: 'phone' });
    } else if (lead.email && byEmail.has(lead.email.toLowerCase())) {
      result.set(rowNumber, { id: byEmail.get(lead.email.toLowerCase())!, matchedOn: 'email' });
    } else if (lead.externalPropertyId && lead.nameNormalized) {
      const key = `${lead.externalPropertyId}::${lead.nameNormalized}`;
      if (byExt.has(key)) result.set(rowNumber, { id: byExt.get(key)!, matchedOn: 'source_property_name' });
    }
  }

  return result;
}

/** Cross-portal visibility (spec §5.4): every enquiry across sources for a lead. */
export interface CrossPortalEnquiry {
  source: CrmSource;
  matchedOn: string;
  leadDate: Date | null;
  createdAt: Date;
}

export async function getCrossPortalEnquiries(client: PoolClient, leadId: string): Promise<CrossPortalEnquiry[]> {
  const r = await client.query<{ incoming_source: CrmSource; matched_on: string; created_at: Date; incoming_payload: any }>(
    `SELECT incoming_source, matched_on, created_at, incoming_payload
     FROM lead_duplicates
     WHERE existing_lead_id = $1
     ORDER BY created_at DESC`,
    [leadId]
  );
  return r.rows.map((row) => ({
    source: row.incoming_source,
    matchedOn: row.matched_on,
    leadDate: row.incoming_payload?.leadDate ? new Date(row.incoming_payload.leadDate) : null,
    createdAt: row.created_at,
  }));
}
