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
