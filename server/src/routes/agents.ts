import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/requireAuth';
import { asyncHandler } from '../lib/asyncHandler';
import {
  AgentNameConflictError,
  AgentNotFoundError,
  createAgent,
  deactivateAgent,
  listAgentsWithStats,
  ReassignmentRequiredError,
  updateAgent,
} from '../services/agentManagementService';

export const agentsRouter = Router();
agentsRouter.use(requireAuth);

agentsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    const { rows } = await pool.query(
      `SELECT id, name, email, phone, is_active, created_at FROM agents
       WHERE ($1 OR is_active = true)
       ORDER BY name ASC`,
      [includeInactive]
    );
    res.json({ agents: rows });
  })
);

agentsRouter.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    const agents = await listAgentsWithStats(includeInactive);
    res.json({ agents });
  })
);

const createAgentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
});

agentsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createAgentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid agent payload.', details: parsed.error.flatten() });
    }
    try {
      const agent = await createAgent(parsed.data);
      res.status(201).json({ agent });
    } catch (err) {
      if (err instanceof AgentNameConflictError) return res.status(409).json({ error: err.message });
      throw err;
    }
  })
);

const updateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

agentsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const parsed = updateAgentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid agent payload.', details: parsed.error.flatten() });
    }
    try {
      const agent = await updateAgent(req.params.id, parsed.data);
      res.json({ agent });
    } catch (err) {
      if (err instanceof AgentNameConflictError) return res.status(409).json({ error: err.message });
      if (err instanceof AgentNotFoundError) return res.status(404).json({ error: err.message });
      throw err;
    }
  })
);

const deactivateSchema = z.object({
  reassignToAgentId: z.string().uuid().nullable().optional(),
  leaveUnassigned: z.boolean().optional(),
});

agentsRouter.post(
  '/:id/deactivate',
  asyncHandler(async (req, res) => {
    const parsed = deactivateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload.', details: parsed.error.flatten() });
    }
    try {
      const result = await deactivateAgent(req.params.id, parsed.data);
      res.json(result);
    } catch (err) {
      if (err instanceof ReassignmentRequiredError) {
        return res.status(409).json({ error: 'NEEDS_REASSIGNMENT', openLeadsCount: err.openLeadsCount });
      }
      if (err instanceof AgentNotFoundError) return res.status(404).json({ error: err.message });
      throw err;
    }
  })
);
