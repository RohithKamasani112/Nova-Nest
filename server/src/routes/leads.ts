import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { asyncHandler } from '../lib/asyncHandler';
import {
  addLeadActivity,
  bulkAction,
  checkDuplicateContact,
  createPersonalLead,
  exportLeadsCsv,
  getChipCounts,
  getLeadDetail,
  getLeadInterests,
  getTodaysCalls,
  LeadFilters,
  LeadNotFoundError,
  listLeads,
  softDeleteLead,
  SortOptions,
  updateLead,
} from '../services/leadsService';

export const leadsRouter = Router();
leadsRouter.use(requireAuth);

function parseArrayParam(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value.map(String);
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseNumberArrayParam(value: unknown): number[] | undefined {
  const arr = parseArrayParam(value);
  if (!arr) return undefined;
  return arr.map(Number).filter((n) => !Number.isNaN(n));
}

function filtersFromQuery(q: Record<string, unknown>): { filters: LeadFilters; sort: SortOptions; page: number; pageSize: number } {
  const filters: LeadFilters = {
    source: parseArrayParam(q.source),
    agentId: parseArrayParam(q.agentId),
    status: parseArrayParam(q.status),
    subStatus: q.subStatus ? String(q.subStatus) : undefined,
    city: parseArrayParam(q.city),
    locality: parseArrayParam(q.locality),
    project: parseArrayParam(q.project),
    listingType: parseArrayParam(q.listingType),
    propertyType: q.propertyType ? String(q.propertyType) : undefined,
    bhk: parseNumberArrayParam(q.bhk),
    priceMin: q.priceMin ? Number(q.priceMin) : undefined,
    priceMax: q.priceMax ? Number(q.priceMax) : undefined,
    leadType: q.leadType ? String(q.leadType) : undefined,
    search: q.search ? String(q.search) : undefined,
    dateField: q.dateField === 'created_at' ? 'created_at' : 'lead_date',
    dateFrom: q.dateFrom ? String(q.dateFrom) : undefined,
    dateTo: q.dateTo ? String(q.dateTo) : undefined,
    followUp: q.followUp as LeadFilters['followUp'],
    hasPhone: q.hasPhone === 'true',
    hasEmail: q.hasEmail === 'true',
    isDuplicate: q.isDuplicate === 'true',
    multiPortal: q.multiPortal === 'true',
    neverContacted: q.neverContacted === 'true',
    contacted: q.contacted === 'true',
    noFollowUpSet: q.noFollowUpSet === 'true',
    batchId: q.batchId ? String(q.batchId) : undefined,
  };
  const sort: SortOptions = {
    sortBy: (q.sortBy as SortOptions['sortBy']) ?? 'created_at',
    sortDir: q.sortDir === 'asc' ? 'asc' : 'desc',
  };
  const page = Math.max(1, Number(q.page) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(q.pageSize) || 50));
  return { filters, sort, page, pageSize };
}

leadsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { filters, sort, page, pageSize } = filtersFromQuery(req.query as Record<string, unknown>);
    const result = await listLeads(filters, sort, page, pageSize);
    res.json({ ...result, page, pageSize });
  })
);

leadsRouter.get(
  '/export.csv',
  asyncHandler(async (req, res) => {
    const { filters, sort } = filtersFromQuery(req.query as Record<string, unknown>);
    const csv = await exportLeadsCsv(filters, sort);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads-export.csv"');
    res.send(csv);
  })
);

leadsRouter.get(
  '/check-duplicate',
  asyncHandler(async (req, res) => {
    const phone = req.query.phone ? String(req.query.phone) : undefined;
    const email = req.query.email ? String(req.query.email) : undefined;
    const match = await checkDuplicateContact(phone, email);
    res.json({ match });
  })
);

leadsRouter.get(
  '/chip-counts',
  asyncHandler(async (_req, res) => {
    const counts = await getChipCounts();
    res.json(counts);
  })
);

leadsRouter.get(
  '/today-calls',
  asyncHandler(async (req, res) => {
    const agentId = req.query.agentId ? String(req.query.agentId) : undefined;
    const result = await getTodaysCalls(agentId);
    res.json(result);
  })
);

const personalLeadSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  altPhone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  agentId: z.string().uuid().nullable().optional(),
  leadDate: z.string().nullable().optional(),
  sourceDetail: z.string().nullable().optional(),
  listingType: z.string().nullable().optional(),
  propertyType: z.string().nullable().optional(),
  configuration: z.string().nullable().optional(),
  priceMin: z.number().nullable().optional(),
  priceMax: z.number().nullable().optional(),
  city: z.string().nullable().optional(),
  locality: z.string().nullable().optional(),
  project: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  nextFollowUpAt: z.string().nullable().optional(),
  status: z.string().optional(),
  overrideDuplicateReason: z.string().nullable().optional(),
});

leadsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = personalLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid lead payload.', details: parsed.error.flatten() });
    }
    const id = await createPersonalLead({ ...parsed.data, userId: req.user!.id });
    res.status(201).json({ id });
  })
);

const bulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  action: z.enum(['assign_agent', 'change_status', 'delete']),
  payload: z
    .object({ agentId: z.string().uuid().nullable().optional(), status: z.string().optional(), lostReason: z.string().optional() })
    .optional(),
});

leadsRouter.post(
  '/bulk',
  asyncHandler(async (req, res) => {
    const parsed = bulkSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid bulk action payload.', details: parsed.error.flatten() });
    }
    try {
      const result = await bulkAction({ ...parsed.data, userId: req.user!.id });
      res.json(result);
    } catch (err) {
      if (err instanceof Error && err.message === 'LOST_REASON_REQUIRED') {
        return res.status(400).json({ error: 'A lost reason is required — some selected leads don\'t have one yet.' });
      }
      if (err instanceof Error && err.message === 'INVALID_STATUS') {
        return res.status(400).json({ error: 'Invalid status value.' });
      }
      throw err;
    }
  })
);

leadsRouter.get(
  '/:id/interests',
  asyncHandler(async (req, res) => {
    const interests = await getLeadInterests(req.params.id);
    res.json({ interests });
  })
);

leadsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    try {
      const detail = await getLeadDetail(req.params.id);
      res.json(detail);
    } catch (err) {
      if (err instanceof LeadNotFoundError) return res.status(404).json({ error: err.message });
      throw err;
    }
  })
);

const updateSchema = z.object({
  status: z.string().optional(),
  agentId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  subStatus: z.string().nullable().optional(),
  nextFollowUpAt: z.string().nullable().optional(),
  lostReason: z.string().nullable().optional(),
  dealValue: z.number().nullable().optional(),
});

leadsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid update payload.', details: parsed.error.flatten() });
    }
    try {
      const lead = await updateLead(req.params.id, { ...parsed.data, userId: req.user!.id });
      res.json({ lead });
    } catch (err) {
      if (err instanceof LeadNotFoundError) return res.status(404).json({ error: err.message });
      if (err instanceof Error && err.message === 'LOST_REASON_REQUIRED') {
        return res.status(400).json({ error: 'A lost reason is required when marking a lead closed_lost.' });
      }
      if (err instanceof Error && err.message === 'INVALID_STATUS') {
        return res.status(400).json({ error: 'Invalid status value.' });
      }
      throw err;
    }
  })
);

leadsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    try {
      await softDeleteLead(req.params.id);
      res.status(204).send();
    } catch (err) {
      if (err instanceof LeadNotFoundError) return res.status(404).json({ error: err.message });
      throw err;
    }
  })
);

const activitySchema = z.object({
  type: z.string().min(1),
  content: z.string().nullable().optional(),
  nextFollowUpAt: z.string().nullable().optional(),
});

leadsRouter.post(
  '/:id/activities',
  asyncHandler(async (req, res) => {
    const parsed = activitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid activity payload.' });
    }
    const activity = await addLeadActivity(
      req.params.id,
      parsed.data.type,
      parsed.data.content ?? null,
      req.user!.id,
      parsed.data.nextFollowUpAt
    );
    res.status(201).json({ activity });
  })
);
