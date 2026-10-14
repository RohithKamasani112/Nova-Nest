import rateLimit from 'express-rate-limit';

/** Applied to the upload endpoint specifically (spec §11: "Rate-limit the upload endpoint"). */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads from this session. Please wait a few minutes and try again.' },
});

/** Applied to the public (unauthenticated) website lead-intake endpoint — no
 *  login is required to hit it, so it needs its own, tighter cap against
 *  spam/bot submissions than the admin-only upload endpoint above. */
export const publicLeadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a few minutes and try again.' },
});
