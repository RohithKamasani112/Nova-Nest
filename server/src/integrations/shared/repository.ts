import { createHash, randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { normalizeNameKey } from '../../lib/valueNormalize';
import { LeadRepository, NormalizedLead } from './types';

export function dedupeKey(lead: NormalizedLead, rule: string = 'mobile_project'): string {
  if (!['mobile_project', 'source_mobile_project'].includes(rule)) throw new Error('Invalid dedupe rule');
  const parts = [lead.mobile, lead.project.trim().toLowerCase()];
  if (rule === 'source_mobile_project') parts.unshift(lead.source);
  return createHash('sha256').update(JSON.stringify(parts)).digest('hex');
}
type Transaction = <T>(fn: (client: PoolClient) => Promise<T>) => Promise<T>;
export function createPostgresRepository(transaction: Transaction, rule?: string): LeadRepository {
  return {
    save: lead => transaction(async client => {
      await client.query("SET LOCAL statement_timeout = '4000ms'");
      const id = randomUUID();
      const key = dedupeKey(lead, rule);
      // Serialize same-contact/project writes across both portal adapters.
      // Magicbricks retains its existing source-scoped retry behavior.
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [dedupeKey(lead)]);
      if (lead.source === 'housing') {
        const existing = await client.query<{ id: string }>(
          `SELECT id FROM leads WHERE phone = $1 AND lower(trim(project_name)) = $2
           AND deleted_at IS NULL ORDER BY created_at LIMIT 1`, [lead.mobile, lead.project.trim().toLowerCase()]);
        if (existing.rows.length) {
          await client.query(
            `INSERT INTO integration_lead_dedupe (provider, dedupe_key, lead_id)
             VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [lead.source, key, existing.rows[0].id]);
          return 'duplicate';
        }
      }
      const claim = await client.query(
        `INSERT INTO integration_lead_dedupe (provider, dedupe_key, lead_id)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING lead_id`, [lead.source, key, id]);
      if (!claim.rows.length) return 'duplicate';
      // Preserve the existing CRM's global contact indexes. A new project for
      // the same phone is a distinct enquiry, linked to its primary contact.
      const findPrimary = () => client.query<{ id: string; phone: string | null }>(
        `SELECT id, phone FROM leads WHERE deleted_at IS NULL AND is_duplicate = false
         AND (phone = $1 OR ($2::text IS NOT NULL AND lower(email) = $2)) ORDER BY created_at LIMIT 1`, [lead.mobile, lead.email]);
      let primary = (await findPrimary()).rows[0] ?? null;
      const metadata = JSON.stringify({ integration: lead.source, country_code: lead.country_code, received_at: lead.received_at, raw_isd: lead.raw_isd, raw_payload: lead.raw_payload });
      const insert = (duplicateOf: string | null) => client.query(
        `INSERT INTO leads (id, source, name, name_normalized, phone, phone_raw, email, project_name,
         city, message, lead_date, status, raw_data, is_duplicate, duplicate_of_id, created_at, updated_at)
         VALUES ($1, $14, $2, $3, $4, $4, $5, $6, $7, $8, $9, 'new', $10, $11, $12, $13, $13)
         ON CONFLICT DO NOTHING RETURNING id`,
        [id, lead.name, normalizeNameKey(lead.name), lead.mobile, lead.email, lead.project, lead.city, lead.message, lead.lead_dt, metadata, !!duplicateOf, duplicateOf, lead.received_at, lead.source]);
      if (!(await insert(primary?.id ?? null)).rows.length) {
        // A website/import write may have acquired the global phone/email index
        // concurrently. The next statement sees its committed primary contact.
        primary = (await findPrimary()).rows[0] ?? null;
        if (!primary || !(await insert(primary.id)).rows.length) throw new Error('Lead write conflict');
      }
      if (primary) await client.query(
        `INSERT INTO lead_duplicates (existing_lead_id, incoming_source, matched_on, incoming_payload)
         VALUES ($1, $4, $2, $3)`,
        [primary.id, primary.phone === lead.mobile ? 'phone' : 'email', JSON.stringify({ 'Project Name': lead.project, ...lead.raw_payload }), lead.source]);
      return 'created';
    }),
  };
}
