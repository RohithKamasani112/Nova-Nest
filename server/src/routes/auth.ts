import { Router } from 'express';
import { z } from 'zod';
import {
  getSalesAccountEmail,
  getUserById,
  InvalidCredentialsError,
  SalesAccountConflictError,
  login,
  upsertSalesAccount,
} from '../services/authService';
import { requireAuth } from '../middleware/requireAuth';
import { asyncHandler } from '../lib/asyncHandler';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const salesAccountSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    try {
      const { user, token } = await login(parsed.data.email, parsed.data.password);
      res.json({ user, token });
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        return res.status(401).json({ error: err.message });
      }
      throw err;
    }
  })
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await getUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  })
);

// Admin-only: manage the one shared sales-team login (Settings page).
authRouter.get(
  '/sales-account',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
    const email = await getSalesAccountEmail();
    res.json({ email });
  })
);

authRouter.put(
  '/sales-account',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
    const parsed = salesAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid email or password.' });
    }
    try {
      const result = await upsertSalesAccount(parsed.data.email, parsed.data.password);
      res.json(result);
    } catch (error) {
      if (error instanceof SalesAccountConflictError) return res.status(409).json({ error: error.message });
      throw error;
    }
  })
);
