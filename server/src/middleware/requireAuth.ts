import { NextFunction, Request, Response } from 'express';
import { verifyAuthToken } from '../lib/jwt';
import { pool } from '../db/pool';
import { crmIdentity, CrmIdentity } from '../lib/crmAccess';

declare global {
  namespace Express { interface Request { user?: CrmIdentity; } }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
  let payload;
  try { payload = verifyAuthToken(header.slice(7)); }
  catch { return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' }); }
  try {
    const { rows } = await pool.query<CrmIdentity>(
      `SELECT u.id, u.email, u.role, u.source_scope, u.session_version, a.id AS agent_id
       FROM users u LEFT JOIN agents a ON a.user_id = u.id AND a.is_active = true
       WHERE u.id = $1 AND u.is_active = true`, [payload.sub]);
    const user = rows[0];
    if (!user || !['admin', 'agent', 'telecaller'].includes(user.role) || (user.role === 'agent' && !user.agent_id) || user.session_version !== (payload.sessionVersion ?? 0)) {
      return res.status(401).json({ error: 'Session revoked. Please log in again.' });
    }
    req.user = user;
    crmIdentity.run(user, next);
  } catch (error) { next(error); }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  next();
}
