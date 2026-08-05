import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { asyncHandler } from '../lib/asyncHandler';
import { getAgentLeaderboard, getAgentSourceCrosstab, getKpis, KpiParams } from '../services/kpiService';

export const kpisRouter = Router();
kpisRouter.use(requireAuth);

const querySchema = z.object({
  from: z.string(),
  to: z.string(),
  dateField: z.enum(['lead_date', 'created_at']).default('lead_date'),
  agentId: z.string().uuid().optional(),
  source: z.enum(['housing', 'magicbricks', '99acres', 'personal']).optional(),
});

function parseQuery(q: unknown) {
  const parsed = querySchema.safeParse(q);
  if (!parsed.success) return null;
  return parsed.data satisfies KpiParams;
}

kpisRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = parseQuery(req.query);
    if (!params) return res.status(400).json({ error: 'from and to (ISO dates) are required.' });
    const result = await getKpis(params);
    res.json(result);
  })
);

kpisRouter.get(
  '/agents',
  asyncHandler(async (req, res) => {
    const params = parseQuery(req.query);
    if (!params) return res.status(400).json({ error: 'from and to (ISO dates) are required.' });
    const [leaderboard, crosstab] = await Promise.all([getAgentLeaderboard(params), getAgentSourceCrosstab(params)]);
    res.json({ leaderboard, crosstab });
  })
);
