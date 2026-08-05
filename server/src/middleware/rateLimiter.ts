import rateLimit from 'express-rate-limit';

/** Applied to the upload endpoint specifically (spec §11: "Rate-limit the upload endpoint"). */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads from this session. Please wait a few minutes and try again.' },
});
