import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { pool, withTransaction } from '../db/pool';
import { requireAdmin, requireAuth } from '../middleware/requireAuth';
import { asyncHandler } from '../lib/asyncHandler';
import { PORTAL_SOURCES } from '../lib/crmAccess';

export const teamAccountsRouter = Router();
teamAccountsRouter.use(requireAuth, requireAdmin);

teamAccountsRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(`SELECT u.id, u.username, u.name, u.role, u.source_scope,
    u.is_active, a.id AS agent_id, a.name AS agent_name FROM users u
    LEFT JOIN agents a ON a.user_id = u.id WHERE u.role IN ('agent','telecaller') ORDER BY u.name`);
  res.json({ accounts: rows });
}));

const schema = z.object({
  id: z.string().uuid().optional(),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9._-]{2,63}$/, 'Username: 3–64 letters, numbers, dots, underscores or dashes.'),
  name: z.string().trim().min(1).max(200),
  password: z.string().min(8).max(128).optional(),
  role: z.enum(['telecaller', 'agent']),
  portal: z.enum(['magicbricks', 'housing', '99acres', 'custom']).optional(),
  portals: z.array(z.enum(['magicbricks', 'housing', '99acres', 'custom'])).min(1).max(4).optional(),
  agentId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (!data.id && !data.password) ctx.addIssue({ code: 'custom', message: 'Password required for a new account.' });
  if (data.role === 'telecaller' && !data.portals?.length && !data.portal) ctx.addIssue({ code: 'custom', message: 'Choose at least one lead source.' });
  if (data.role === 'agent' && !data.agentId) ctx.addIssue({ code: 'custom', message: 'Choose a team member.' });
});

teamAccountsRouter.put('/', asyncHandler(async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const input = parsed.data;
  const hash = input.password ? await bcrypt.hash(input.password, 10) : null;
  try {
    const id = await withTransaction(async client => {
      // Serialize credential/link edits so accounts cannot claim the same roster member.
      await client.query("SELECT pg_advisory_xact_lock(hashtext('team-accounts'))");
      if (input.id) {
        const existing = await client.query("SELECT id FROM users WHERE id = $1 AND role IN ('agent','telecaller') FOR UPDATE", [input.id]);
        if (!existing.rowCount) throw new Error('ACCOUNT_NOT_FOUND');
      }
      if (input.role === 'agent') {
        const agent = await client.query('SELECT id, user_id FROM agents WHERE id = $1 AND is_active = true FOR UPDATE', [input.agentId]);
        if (!agent.rowCount) throw new Error('TEAM_NOT_FOUND');
        if (agent.rows[0].user_id && agent.rows[0].user_id !== input.id) throw new Error('TEAM_ALREADY_LINKED');
      }
      const scope = input.role === 'telecaller'
        ? [...new Set((input.portals ?? [input.portal!]).flatMap(portal => PORTAL_SOURCES[portal]))]
        : [];
      let userId = input.id;
      if (userId) {
        await client.query(`UPDATE users SET username = $2, name = $3, role = $4, source_scope = $5,
          is_active = $6, password_hash = COALESCE($7, password_hash), session_version = session_version + 1 WHERE id = $1`,
          [userId, input.username, input.name, input.role, scope, input.isActive, hash]);
      } else {
        const result = await client.query(`INSERT INTO users (username, email, name, role, source_scope, is_active, password_hash)
          VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
          [input.username, `${input.username}@team.novanest.internal`, input.name, input.role, scope, input.isActive, hash]);
        userId = result.rows[0].id;
      }
      // Source access covers every existing and future lead. Transfer only the
      // selected sources, preserving other scopes and invalidating stale sessions.
      if (scope.length) {
        await client.query(`UPDATE users u SET source_scope = ARRAY(
            SELECT source FROM unnest(u.source_scope) AS source
            WHERE NOT (source = ANY($2::text[]))
          ), session_version = session_version + 1
          WHERE u.role = 'telecaller' AND u.id <> $1 AND u.source_scope && $2::text[]`,
          [userId, scope]);
      }
      await client.query('UPDATE agents SET user_id = NULL WHERE user_id = $1', [userId]);
      if (input.role === 'agent') await client.query('UPDATE agents SET user_id = $1 WHERE id = $2', [userId, input.agentId]);
      return userId;
    });
    res.json({ id });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === '23505') return res.status(409).json({ error: 'Username or team member already has an account.' });
    if (error instanceof Error && ['ACCOUNT_NOT_FOUND', 'TEAM_NOT_FOUND', 'TEAM_ALREADY_LINKED'].includes(error.message)) {
      return res.status(409).json({ error: 'Account or active team member unavailable. Refresh and check the selected member.' });
    }
    throw error;
  }
}));
