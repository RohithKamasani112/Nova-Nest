import { Router, ErrorRequestHandler, RequestHandler } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth, requireAdmin } from '../middleware/requireAuth';
import { StorageError, StorageService, storageService, publicProperties } from '../services/storageService';

const pathSchema = z.string().min(1).max(1200);
const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (error instanceof StorageError) return res.status(error.status).json({ error: error.message });
  if (error instanceof z.ZodError || error instanceof URIError) return res.status(400).json({ error: 'Invalid storage request.' });
  next(error);
};

export function createStorageRouters(service: StorageService = storageService, authenticate: RequestHandler = requireAuth) {
  const storageRouter = Router();
  const publicStorageRouter = Router();
  publicStorageRouter.get('/properties', asyncHandler(async (_req, res) => {
    try {
      const content = await service.read('properties.json');
      res.setHeader('Cache-Control', 'no-store');
      res.json(publicProperties(JSON.parse(content)));
    } catch (error) {
      if (error instanceof StorageError && error.status === 404) return res.json([]);
      throw error;
    }
  }));
  publicStorageRouter.get('/asset', asyncHandler(async (req, res) => {
    const url = await service.download(pathSchema.parse(req.query.path), true);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.redirect(302, url);
  }));
  publicStorageRouter.use(errorHandler);

  storageRouter.use(authenticate, requireAdmin);
  storageRouter.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  storageRouter.get('/object', asyncHandler(async (req, res) => {
    const content = await service.read(pathSchema.parse(req.query.path));
    res.json({ content });
  }));
  storageRouter.put('/object', asyncHandler(async (req, res) => {
    const input = z.object({ path: pathSchema, content: z.string().max(1_500_000), contentType: z.string().max(100).default('application/json') }).parse(req.body);
    await service.write(input.path, input.content, input.contentType);
    res.status(204).send();
  }));
  storageRouter.post('/upload', asyncHandler(async (req, res) => {
    const input = z.object({ path: pathSchema, contentType: z.string().max(100), size: z.number().int().positive().max(50 * 1024 * 1024) }).parse(req.body);
    res.json(await service.upload(input.path, input.contentType, input.size));
  }));
  storageRouter.post('/download', asyncHandler(async (req, res) => {
    const path = pathSchema.parse(req.body?.path);
    res.json({ url: await service.download(path), expiresIn: 300 });
  }));
  storageRouter.delete('/object', asyncHandler(async (req, res) => {
    await service.remove(pathSchema.parse(req.query.path));
    res.status(204).send();
  }));
  storageRouter.get('/list', asyncHandler(async (req, res) => {
    res.json({ keys: await service.list(pathSchema.parse(req.query.prefix)) });
  }));
  storageRouter.use(errorHandler);
  return { storageRouter, publicStorageRouter };
}
