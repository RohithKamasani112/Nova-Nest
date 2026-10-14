import cors from 'cors';
import express from 'express';
import { env } from './env';
import { teamAccountsRouter } from './routes/teamAccounts';
import { createStorageRouters } from './routes/storage';
import { authRouter } from './routes/auth';
import { importRouter, importsListHandler } from './routes/import';
import { agentsRouter } from './routes/agents';
import { leadsRouter } from './routes/leads';
import { kpisRouter } from './routes/kpis';
import { publicLeadsRouter } from './routes/publicLeads';
import { requireAuth, requireAdmin } from './middleware/requireAuth';
import { asyncHandler } from './lib/asyncHandler';
import { getFilterOptions } from './services/leadsService';

export const app = express();

// Production origins are explicit Amplify/custom-domain origins. CORS is not
// authorization: every private storage operation also requires an admin session.
if (!(process.env.AWS_LAMBDA_FUNCTION_NAME && process.env.CORS_AT_FUNCTION_URL === 'true')) app.use(cors({ origin(origin, callback) {
  const local = env.nodeEnv !== 'production' && !!origin && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  callback(null, !origin || env.allowedOrigins.includes(origin) || local);
}, credentials: false, allowedHeaders: ['Authorization', 'Content-Type'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

const { storageRouter, publicStorageRouter } = createStorageRouters();
app.use('/api/storage', storageRouter);
app.use('/api/public/storage', publicStorageRouter);
app.use('/api/auth', authRouter);
app.use('/api/team-accounts', teamAccountsRouter);
app.use('/api/public/leads', publicLeadsRouter);
app.use('/api/crm/import', importRouter);
app.get('/api/crm/imports', requireAuth, requireAdmin, importsListHandler);
app.use('/api/crm/agents', agentsRouter);
app.use('/api/crm/leads', leadsRouter);
app.use('/api/crm/kpis', kpisRouter);
app.get(
  '/api/crm/filters/options',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const options = await getFilterOptions();
    res.json(options);
  })
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const error = err as { name?: string; code?: string };
  console.error(JSON.stringify({ component: 'api', outcome: 'request_failed', name: error?.name ?? 'Error', code: error?.code ?? 'UNKNOWN' }));
  res.status(500).json({ error: 'Internal server error.' });
});
