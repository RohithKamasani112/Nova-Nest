import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler';
import { publicLeadRateLimiter } from '../middleware/rateLimiter';
import { storageService } from '../services/storageService';
import { normalizePhone } from '../lib/valueNormalize';
import { createWebsiteLead } from '../services/leadsService';

/** No `requireAuth` here — this is the one CRM route the public website
 *  itself calls directly (Get a Free Quote modal, contact form, project
 *  quick-enquiry buttons), so it has to work for a signed-out visitor. */
export const publicLeadsRouter = Router();

const websiteLeadSchema = z.object({
  name: z.string().trim().min(1).max(150),
  phone: z.string().max(30).refine(value => /^[+\d\s().-]+$/.test(value) && value.replace(/\D/g, '').length <= 12 && Boolean(normalizePhone(value).phone), 'Enter a valid Indian mobile number.'),
  email: z.string().max(254).refine(value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)).nullable().optional(),
  message: z.string().max(5000).nullable().optional(),
  project: z.string().nullable().optional(),
  leadType: z.string().nullable().optional(),
});

publicLeadsRouter.post(
  '/',
  publicLeadRateLimiter,
  asyncHandler(async (req, res) => {
    const parsed = websiteLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid lead payload.', details: parsed.error.flatten() });
    }
    if (parsed.data.project && parsed.data.project !== 'general') {
      const properties = JSON.parse(await storageService.read('properties.json')) as Record<string, unknown>[];
      if (!properties.some(property => property.id === parsed.data.project && property.isActive !== false && !property.archivedAt)) return res.status(409).json({ error: 'This property is no longer available. Please browse our current listings.' });
    }
    const { id } = await createWebsiteLead(parsed.data);
    res.status(201).json({ id });
  })
);
