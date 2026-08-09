import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../lib/asyncHandler';
import {
  BatchNotFoundError,
  commitImport,
  getBatchErrorsCsv,
  getBatchSummary,
  listBatches,
  previewImport,
  SanityGateError,
} from '../services/importService';
import { UnrecognizedFileError } from '../parsers/formatDetect';
import { CrmSource } from '../types/crm';

export const importRouter = Router();

// Lambda hard-caps synchronous request bodies at 6 MB (Function URL / API
// Gateway, no config gets around it) — 5 MB leaves headroom for multipart
// overhead. Was 20 MB (spec §10.2) when this only ran on a long-running
// server; lower here so an oversized file fails with multer's clear 413
// instead of a confusing platform-level rejection before it even reaches
// this code. Needs the presigned-S3-upload path (bypasses the Lambda body
// entirely) if you actually need files bigger than this.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const SOURCES: CrmSource[] = ['housing', 'magicbricks', '99acres', 'personal'];
const sourceSchema = z.enum(SOURCES as [CrmSource, ...CrmSource[]]);

importRouter.use(requireAuth);

importRouter.post(
  '/preview',
  uploadRateLimiter,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded.' });
    }
    const parsedSource = sourceSchema.safeParse(req.body.source);
    if (!parsedSource.success) {
      return res.status(400).json({ error: `Invalid source. Expected one of: ${SOURCES.join(', ')}.` });
    }

    try {
      const result = await previewImport(req.file.buffer, req.file.originalname, parsedSource.data, req.user!.id);
      res.json(result);
    } catch (err) {
      if (err instanceof UnrecognizedFileError || err instanceof SanityGateError) {
        return res.status(422).json({ error: err.message, detectedHeaders: (err as SanityGateError).headers ?? [] });
      }
      throw err;
    }
  })
);

const commitSchema = z.object({
  batchId: z.string().uuid(),
  mapping: z.record(z.string(), z.string()).default({}),
  defaultAgentId: z.string().uuid().nullable().optional(),
  duplicatePolicy: z.enum(['skip', 'enrich', 'create_anyway']).default('skip'),
  autoCreateAgents: z.boolean().default(true),
});

importRouter.post(
  '/commit',
  asyncHandler(async (req, res) => {
    const parsed = commitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid commit payload.', details: parsed.error.flatten() });
    }
    try {
      const result = await commitImport({
        batchId: parsed.data.batchId,
        mappingOverrides: parsed.data.mapping,
        defaultAgentId: parsed.data.defaultAgentId ?? null,
        duplicatePolicy: parsed.data.duplicatePolicy,
        autoCreateAgents: parsed.data.autoCreateAgents,
        userId: req.user!.id,
      });
      if (result.status === 'completed') {
        const summary = await getBatchSummary(result.batchId);
        return res.json(summary);
      }
      res.status(202).json(result);
    } catch (err) {
      if (err instanceof BatchNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      throw err;
    }
  })
);

importRouter.get(
  '/:id/errors.csv',
  asyncHandler(async (req, res) => {
    try {
      const { fileName, csv } = await getBatchErrorsCsv(req.params.id);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(csv);
    } catch (err) {
      if (err instanceof BatchNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      throw err;
    }
  })
);

/** Mounted separately at GET /api/crm/imports (plural) — see app.ts. */
export const importsListHandler = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;
  const result = await listBatches(limit, offset);
  res.json(result);
});

importRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    try {
      const summary = await getBatchSummary(req.params.id);
      res.json(summary);
    } catch (err) {
      if (err instanceof BatchNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      throw err;
    }
  })
);
