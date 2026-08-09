import serverless from 'serverless-http';
import { app } from './app';

// Wraps the same Express app used by index.ts (local/Fly) — no route or
// middleware logic is Lambda-specific, only this thin adapter layer plus
// the environment-aware behavior already gated on AWS_LAMBDA_FUNCTION_NAME
// in db/pool.ts and services/importService.ts.
export const handler = serverless(app);
