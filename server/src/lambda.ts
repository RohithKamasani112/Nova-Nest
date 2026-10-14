import serverless from 'serverless-http';
import { app } from './app';

// Wraps the same Express app used by index.ts (local/Fly) — no route or
// middleware logic is Lambda-specific, only this thin adapter layer plus
// the environment-aware behavior already gated on AWS_LAMBDA_FUNCTION_NAME
// in db/pool.ts and services/importService.ts.
const applicationHandler = serverless(app);
export const handler = async (event: any, context: any) => {
  if (process.env.DEMO_MODE === 'true' && !event.requestContext && event.source === 'novanest.demo.reset') {
    if (event.action === 'verify-isolation') return require('../demo-data.cjs').verifyIsolation();
    return require('../demo-data.cjs').reset();
  }
  return applicationHandler(event, context);
};
