import { PoolClient } from 'pg';
import { CrmSource } from '../types/crm';

/** normalizedHeaderKey -> canonicalField, previously saved overrides for this source. */
export async function loadOverrides(client: PoolClient, source: CrmSource): Promise<Record<string, string>> {
  const { rows } = await client.query<{ normalized: string; mapped_field: string }>(
    'SELECT normalized, mapped_field FROM source_mapping_overrides WHERE source = $1',
    [source]
  );
  const overrides: Record<string, string> = {};
  for (const row of rows) overrides[row.normalized] = row.mapped_field;
  return overrides;
}

/**
 * Persists user-chosen overrides from the mapping-preview step so they're
 * applied automatically next time (spec §3: "Overrides are saved per-source
 * and reused as the default next time").
 */
export async function saveOverrides(
  client: PoolClient,
  source: CrmSource,
  overrides: Record<string, string>,
  updatedBy: string | null
): Promise<void> {
  for (const [normalized, mappedField] of Object.entries(overrides)) {
    await client.query(
      `INSERT INTO source_mapping_overrides (source, normalized, mapped_field, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (source, normalized) DO UPDATE SET
         mapped_field = EXCLUDED.mapped_field,
         updated_by = EXCLUDED.updated_by,
         updated_at = now()`,
      [source, normalized, mappedField, updatedBy]
    );
  }
}
