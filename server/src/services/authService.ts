import bcrypt from 'bcryptjs';
import { pool } from '../db/pool';
import { signAuthToken } from '../lib/jwt';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  username?: string | null;
  source_scope?: string[];
  agent_id?: string | null;
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid username or password.');
    this.name = 'InvalidCredentialsError';
  }
}

export async function login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
  const { rows } = await pool.query<{
    id: string;
    email: string;
    name: string;
    role: string;
    password_hash: string;
    is_active: boolean;
    username: string | null; source_scope: string[]; agent_id: string | null; session_version: number;
  }>(`SELECT u.*, a.id AS agent_id FROM users u LEFT JOIN agents a ON a.user_id = u.id AND a.is_active = true
      WHERE lower(u.email) = lower($1) OR lower(u.username) = lower($1)`, [email]);

  const row = rows[0];
  if (!row || !row.is_active || !['admin', 'agent', 'telecaller'].includes(row.role) || (row.role === 'agent' && !row.agent_id)) throw new InvalidCredentialsError();

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) throw new InvalidCredentialsError();

  const user: AuthUser = { id: row.id, email: row.email, name: row.name, role: row.role, username: row.username, source_scope: row.source_scope, agent_id: row.agent_id };
  const token = signAuthToken({ sub: user.id, email: user.email, role: user.role, sessionVersion: row.session_version });
  return { user, token };
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const { rows } = await pool.query<{ id: string; email: string; name: string; role: string }>(
    `SELECT u.id, u.email, u.name, u.role, u.username, u.source_scope, a.id AS agent_id FROM users u
     LEFT JOIN agents a ON a.user_id = u.id AND a.is_active = true WHERE u.id = $1 AND u.is_active = true`,
    [id]
  );
  return rows[0] ?? null;
}

// Legacy shared-account helpers retained for older callers; routes are retired.
export async function getSalesAccountEmail(): Promise<string | null> { return null; }
export class SalesAccountConflictError extends Error {}
export async function upsertSalesAccount(_email: string, _password: string): Promise<{ email: string }> {
  throw new SalesAccountConflictError('Shared sales login retired. Use team accounts.');
}
