import { pool, withTransaction } from '../db/pool';
import { collapseWhitespace } from '../lib/textUtils';

const TERMINAL_STATUSES = "('converted','closed_lost','junk')";

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 1000) / 10 : 0;
}

export interface AgentStatsRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: Date;
  total_leads: number;
  converted: number;
  conversion_rate: number;
  overdue_follow_ups: number;
}

export async function listAgentsWithStats(includeInactive: boolean): Promise<AgentStatsRow[]> {
  const { rows } = await pool.query<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    is_active: boolean;
    created_at: Date;
    total_leads: string;
    converted: string;
    overdue_follow_ups: string;
  }>(
    `SELECT
       a.id, a.name, a.email, a.phone, a.is_active, a.created_at,
       count(l.id) AS total_leads,
       count(l.id) FILTER (WHERE l.status = 'converted') AS converted,
       count(l.id) FILTER (
         WHERE l.next_follow_up_at < now() AND l.status NOT IN ${TERMINAL_STATUSES}
       ) AS overdue_follow_ups
     FROM agents a
     LEFT JOIN leads l ON l.agent_id = a.id AND l.deleted_at IS NULL
     WHERE ($1 OR a.is_active = true)
     GROUP BY a.id
     ORDER BY a.name ASC`,
    [includeInactive]
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    is_active: r.is_active,
    created_at: r.created_at,
    total_leads: Number(r.total_leads),
    converted: Number(r.converted),
    conversion_rate: pct(Number(r.converted), Number(r.total_leads)),
    overdue_follow_ups: Number(r.overdue_follow_ups),
  }));
}

export class AgentNameConflictError extends Error {
  constructor(public name: string) {
    super(`An agent named ${name} already exists.`);
    this.name = 'AgentNameConflictError';
  }
}

export class AgentNotFoundError extends Error {
  constructor() {
    super('Agent not found.');
    this.name = 'AgentNotFoundError';
  }
}

export interface CreateAgentInput {
  name: string;
  email?: string | null;
  phone?: string | null;
}

export async function createAgent(input: CreateAgentInput) {
  const name = collapseWhitespace(input.name);
  const nameNormalized = name.toLowerCase();
  const existing = await pool.query('SELECT id FROM agents WHERE name_normalized = $1', [nameNormalized]);
  if (existing.rows.length > 0) throw new AgentNameConflictError(name);

  const { rows } = await pool.query(
    `INSERT INTO agents (name, name_normalized, email, phone)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, phone, is_active, created_at`,
    [name, nameNormalized, input.email ?? null, input.phone ?? null]
  );
  return rows[0];
}

export interface UpdateAgentInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
}

export async function updateAgent(id: string, input: UpdateAgentInput) {
  const sets: string[] = [];
  const params: unknown[] = [];
  const p = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };

  if (input.name !== undefined) {
    const name = collapseWhitespace(input.name);
    const nameNormalized = name.toLowerCase();
    const conflict = await pool.query('SELECT id FROM agents WHERE name_normalized = $1 AND id != $2', [nameNormalized, id]);
    if (conflict.rows.length > 0) throw new AgentNameConflictError(name);
    sets.push(`name = ${p(name)}`, `name_normalized = ${p(nameNormalized)}`);
  }
  if (input.email !== undefined) sets.push(`email = ${p(input.email)}`);
  if (input.phone !== undefined) sets.push(`phone = ${p(input.phone)}`);
  if (input.isActive !== undefined) sets.push(`is_active = ${p(input.isActive)}`);

  if (sets.length === 0) {
    const { rows } = await pool.query('SELECT id, name, email, phone, is_active, created_at FROM agents WHERE id = $1', [id]);
    if (!rows[0]) throw new AgentNotFoundError();
    return rows[0];
  }

  const { rows } = await pool.query(
    `UPDATE agents SET ${sets.join(', ')} WHERE id = ${p(id)}
     RETURNING id, name, email, phone, is_active, created_at`,
    params
  );
  if (!rows[0]) throw new AgentNotFoundError();
  return rows[0];
}

export class ReassignmentRequiredError extends Error {
  constructor(public openLeadsCount: number) {
    super('This agent has open leads — reassign or leave them unassigned before deactivating.');
    this.name = 'ReassignmentRequiredError';
  }
}

export interface DeactivateAgentInput {
  reassignToAgentId?: string | null;
  leaveUnassigned?: boolean;
}

export async function deactivateAgent(id: string, input: DeactivateAgentInput): Promise<{ reassignedCount: number }> {
  return withTransaction(async (client) => {
    const agent = await client.query('SELECT id FROM agents WHERE id = $1', [id]);
    if (!agent.rows[0]) throw new AgentNotFoundError();

    const openLeads = await client.query(
      `SELECT count(*) FROM leads WHERE agent_id = $1 AND deleted_at IS NULL AND status NOT IN ${TERMINAL_STATUSES}`,
      [id]
    );
    const openLeadsCount = Number(openLeads.rows[0].count);

    if (openLeadsCount > 0 && !input.leaveUnassigned && !input.reassignToAgentId) {
      throw new ReassignmentRequiredError(openLeadsCount);
    }

    if (openLeadsCount > 0) {
      await client.query(
        `UPDATE leads SET agent_id = $1 WHERE agent_id = $2 AND deleted_at IS NULL AND status NOT IN ${TERMINAL_STATUSES}`,
        [input.reassignToAgentId ?? null, id]
      );
    }

    await client.query('UPDATE agents SET is_active = false WHERE id = $1', [id]);
    return { reassignedCount: openLeadsCount };
  });
}
