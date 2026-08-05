import cors from 'cors';
import express from 'express';
import { env } from './env';
import { authRouter } from './routes/auth';
import { importRouter, importsListHandler } from './routes/import';
import { agentsRouter } from './routes/agents';
import { leadsRouter } from './routes/leads';
import { kpisRouter } from './routes/kpis';
import { requireAuth } from './middleware/requireAuth';
import { asyncHandler } from './lib/asyncHandler';
import { getFilterOptions } from './services/leadsService';

export const app = express();

// Reflects whatever Origin the browser sends, so every origin is allowed
// while still supporting credentialed requests (wildcard '*' can't be used
// together with credentials: true per the CORS spec).
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/crm/import', importRouter);
app.get('/api/crm/imports', requireAuth, importsListHandler);
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
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Internal server error.' });
});
