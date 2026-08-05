import { PoolClient } from 'pg';
import { collapseWhitespace } from '../lib/textUtils';

export interface ResolveAgentResult {
  agentId: string | null;
  created: boolean;
  warning?: string;
}

function normalizeAgentName(name: string): string {
  return collapseWhitespace(name).toLowerCase();
}

/**
 * Agent column resolution (spec §2.4):
 *  - value present + matches existing agent (case-insensitive, ws-collapsed) -> link.
 *  - value present, no match -> create if autoCreateAgents, else null + warning.
 *  - column missing/blank -> fall back to defaultAgentId (may itself be null = Unassigned).
 */
export async function resolveAgent(
  client: PoolClient,
  agentNameRaw: string | null,
  defaultAgentId: string | null,
  autoCreateAgents: boolean
): Promise<ResolveAgentResult> {
  if (!agentNameRaw) {
    return { agentId: defaultAgentId, created: false };
  }

  const nameNormalized = normalizeAgentName(agentNameRaw);
  const existing = await client.query<{ id: string }>(
    'SELECT id FROM agents WHERE name_normalized = $1 AND is_active = true LIMIT 1',
    [nameNormalized]
  );
  if (existing.rows[0]) {
    return { agentId: existing.rows[0].id, created: false };
  }

  if (!autoCreateAgents) {
    return {
      agentId: defaultAgentId,
      created: false,
      warning: `Agent "${agentNameRaw}" not found and auto-create is off; fell back to the default agent.`,
    };
  }

  const inserted = await client.query<{ id: string }>(
    `INSERT INTO agents (name, name_normalized)
     VALUES ($1, $2)
     ON CONFLICT (name_normalized) DO UPDATE SET name_normalized = EXCLUDED.name_normalized
     RETURNING id`,
    [collapseWhitespace(agentNameRaw), nameNormalized]
  );
  return { agentId: inserted.rows[0].id, created: true };
}

/**
 * Chunk-level batch version of resolveAgent: 1-2 queries for the whole
 * chunk instead of one round trip per row. Returns normalized name -> agentId.
 * Rows whose agent column was blank aren't included here — callers fall
 * back to defaultAgentId for those directly, no lookup needed.
 */
export async function resolveAgentsBatch(
  client: PoolClient,
  namesRaw: string[],
  autoCreateAgents: boolean
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (namesRaw.length === 0) return map;

  const byNorm = new Map<string, string>(); // normalized -> a raw form to display
  for (const raw of namesRaw) {
    const norm = normalizeAgentName(raw);
    if (!byNorm.has(norm)) byNorm.set(norm, collapseWhitespace(raw));
  }
  const normalizedNames = Array.from(byNorm.keys());

  const existing = await client.query<{ id: string; name_normalized: string }>(
    'SELECT id, name_normalized FROM agents WHERE name_normalized = ANY($1) AND is_active = true',
    [normalizedNames]
  );
  for (const row of existing.rows) map.set(row.name_normalized, row.id);

  if (autoCreateAgents) {
    const missingNorms = normalizedNames.filter((n) => !map.has(n));
    if (missingNorms.length > 0) {
      const missingNames = missingNorms.map((n) => byNorm.get(n)!);
      const inserted = await client.query<{ id: string; name_normalized: string }>(
        `INSERT INTO agents (name, name_normalized)
         SELECT * FROM unnest($1::text[], $2::text[])
         ON CONFLICT (name_normalized) DO UPDATE SET name_normalized = EXCLUDED.name_normalized
         RETURNING id, name_normalized`,
        [missingNames, missingNorms]
      );
      for (const row of inserted.rows) map.set(row.name_normalized, row.id);
    }
  }

  return map;
}
