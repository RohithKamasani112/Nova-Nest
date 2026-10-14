import bcrypt from 'bcryptjs';
import { pool } from '../db/pool';
import { signAuthToken } from '../lib/jwt';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password.');
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
  }>('SELECT id, email, name, role, password_hash, is_active FROM users WHERE lower(email) = lower($1)', [email]);

  const row = rows[0];
  if (!row || !row.is_active) throw new InvalidCredentialsError();

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) throw new InvalidCredentialsError();

  const user: AuthUser = { id: row.id, email: row.email, name: row.name, role: row.role };
  const token = signAuthToken({ sub: user.id, email: user.email, role: user.role });
  return { user, token };
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const { rows } = await pool.query<{ id: string; email: string; name: string; role: string }>(
    'SELECT id, email, name, role FROM users WHERE id = $1 AND is_active = true',
    [id]
  );
  return rows[0] ?? null;
}

// A single shared login the whole sales team uses (owner's request: not
// individual per-person accounts — whoever's on shift logs in, then picks
// "who I am" from the agent roster or "all leads" on their own device; see
// SalesHomePage.tsx). At most one active `role = 'sales'` row exists at a
// time — changing the email deactivates the old row rather than deleting it,
// so historical `users.id` references (e.g. any activity logged while
// signed in as this account) still resolve.
export async function getSalesAccountEmail(): Promise<string | null> {
  const { rows } = await pool.query<{ email: string }>(
    "SELECT email FROM users WHERE role = 'sales' AND is_active = true LIMIT 1"
  );
  return rows[0]?.email ?? null;
}

export async function upsertSalesAccount(email: string, password: string): Promise<{ email: string }> {
  const passwordHash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
  await client.query('BEGIN');
  await client.query("SELECT pg_advisory_xact_lock(hashtext('sales-account'))");
  const existing = await client.query<{ role: string }>('SELECT role FROM users WHERE lower(email) = lower($1)', [email]);
  if (existing.rows.some(user => user.role !== 'sales')) {
    throw new SalesAccountConflictError();
  }
  const { rows } = await client.query<{ email: string }>(
    `INSERT INTO users (email, password_hash, name, role, is_active)
     VALUES ($1, $2, 'Sales Team', 'sales', true)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'sales', is_active = true
     RETURNING email`,
    [email.toLowerCase(), passwordHash]
  );
  await client.query("UPDATE users SET is_active = false WHERE role = 'sales' AND email <> $1", [email.toLowerCase()]);
  await client.query('COMMIT');
  return { email: rows[0].email };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export class SalesAccountConflictError extends Error {
  constructor() { super('This email belongs to another account. Choose a different sales email.'); }
}
