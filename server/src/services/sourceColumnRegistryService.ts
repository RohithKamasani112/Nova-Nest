import { PoolClient } from 'pg';
import { CrmSource } from '../types/crm';
import { FieldMapping } from '../parsers/rowMapper';

/** Read-only: which headers in this file have never been seen for this source (spec §3, preview step). */
export async function findNewHeaders(client: PoolClient, source: CrmSource, mapping: FieldMapping[]): Promise<string[]> {
  if (mapping.length === 0) return [];
  const normalizedList = mapping.map((m) => m.headerNormalized);
  const { rows } = await client.query<{ normalized: string }>(
    'SELECT normalized FROM source_column_registry WHERE source = $1 AND normalized = ANY($2)',
    [source, normalizedList]
  );
  const known = new Set(rows.map((r) => r.normalized));
  return mapping.filter((m) => !known.has(m.headerNormalized)).map((m) => m.header);
}

/** Write: upsert every header seen in this import into the registry (commit step). */
export async function upsertColumnRegistry(
  client: PoolClient,
  source: CrmSource,
  mapping: FieldMapping[],
  sampleRow: Record<string, unknown>
): Promise<void> {
  for (const m of mapping) {
    const sample = sampleRow[m.header];
    const sampleValue = sample === null || sample === undefined ? null : String(sample).slice(0, 200);
    await client.query(
      `INSERT INTO source_column_registry (source, raw_header, normalized, mapped_field, sample_value, times_seen, first_seen_at, last_seen_at)
       VALUES ($1, $2, $3, $4, $5, 1, now(), now())
       ON CONFLICT (source, normalized) DO UPDATE SET
         raw_header = EXCLUDED.raw_header,
         mapped_field = EXCLUDED.mapped_field,
         sample_value = COALESCE(EXCLUDED.sample_value, source_column_registry.sample_value),
         times_seen = source_column_registry.times_seen + 1,
         last_seen_at = now()`,
      [source, m.header, m.headerNormalized, m.canonicalField, sampleValue]
    );
  }
}
