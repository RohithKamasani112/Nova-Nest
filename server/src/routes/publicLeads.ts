import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler';
import { publicLeadRateLimiter } from '../middleware/rateLimiter';
import { createWebsiteLead } from '../services/leadsService';

/** No `requireAuth` here — this is the one CRM route the public website
 *  itself calls directly (Get a Free Quote modal, contact form, project
 *  quick-enquiry buttons), so it has to work for a signed-out visitor. */
export const publicLeadsRouter = Router();

const websiteLeadSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
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
    const { id } = await createWebsiteLead(parsed.data);
    res.status(201).json({ id });
  })
);
