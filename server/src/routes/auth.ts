import { Router } from 'express';
import { z } from 'zod';
import {
  getUserById,
  InvalidCredentialsError,
  login,
} from '../services/authService';
import { requireAuth } from '../middleware/requireAuth';
import { asyncHandler } from '../lib/asyncHandler';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Username and password are required.' });
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

// Shared sales-account endpoints retired; use admin-managed scoped accounts.
authRouter.all('/sales-account', requireAuth, (req, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  res.status(410).json({ error: 'Shared sales login retired. Manage accounts in Team logins.' });
});
