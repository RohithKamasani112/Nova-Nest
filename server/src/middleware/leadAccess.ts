import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';
import { accessSql } from '../lib/crmAccess';

export async function leadAccess(req: Request, res: Response, next: NextFunction) {
  const user = req.user!;
  if (user.role === 'admin') return next();
  if (!['telecaller', 'agent'].includes(user.role)) return res.status(403).json({ error: 'CRM access unavailable.' });
  const id = req.path.split('/')[1];
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (['PATCH', 'DELETE'].includes(req.method) && !uuid.test(id)) return res.status(400).json({ error: 'Invalid lead id.' });
  if (req.method === 'DELETE' || req.body?.action === 'delete') return res.status(403).json({ error: 'Only admins can delete leads.' });
  if (user.role === 'agent' && !(req.method === 'POST' && req.path === '/') && (req.body?.agentId !== undefined || req.body?.action === 'assign_agent')) {
    return res.status(403).json({ error: 'Only admins and telecallers can assign leads.' });
  }
  if (req.method === 'POST' && req.path === '/' && user.role === 'telecaller' && !user.source_scope.includes('personal')) {
    return res.status(403).json({ error: 'Custom lead access is required to create custom leads.' });
  }
  if (req.method === 'POST' && req.path === '/' && user.role === 'agent') req.body.agentId = user.agent_id;
  const ids: unknown[] = uuid.test(id) ? [id] : req.path === '/bulk' ? req.body?.ids : [];
  if (!Array.isArray(ids) || ids.some(value => typeof value !== 'string' || !uuid.test(value))) return res.status(400).json({ error: 'Invalid lead ids.' });
  try {
    if (ids.length) {
      const values: unknown[] = [ids];
      const access = accessSql(values, 'l');
      const result = await pool.query(`SELECT l.id FROM leads l WHERE l.id = ANY($1::uuid[]) AND l.deleted_at IS NULL AND ${access}`, values);
      if (result.rowCount !== new Set(ids).size) return res.status(404).json({ error: 'Lead not found.' });
    }
    const target = req.body?.agentId ?? req.body?.payload?.agentId;
    if (target) {
      if (!uuid.test(target)) return res.status(400).json({ error: 'Invalid team member.' });
      const result = await pool.query('SELECT id FROM agents WHERE id = $1 AND is_active = true', [target]);
      if (!result.rowCount) return res.status(400).json({ error: 'Choose an active team member.' });
    }
    next();
  } catch (error) { next(error); }
}
