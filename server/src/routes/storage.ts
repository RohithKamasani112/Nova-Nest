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
  storageRouter.post('/properties/:id', asyncHandler(async (req, res) => {
    const body = z.object({ operation: z.enum(['create', 'update', 'archive', 'restore', 'delete']), input: z.object({ title: z.string().max(300).optional(), price: z.number().finite().nonnegative().optional(), locality: z.string().max(200).optional(), location: z.string().max(1500).optional(), description: z.string().max(20000).optional(), images: z.array(z.string().max(2000)).max(50).optional(), bedrooms: z.number().int().nonnegative().max(50).optional(), bathrooms: z.number().int().nonnegative().max(50).optional(), areaSqft: z.number().finite().nonnegative().optional(), category: z.enum(['apartment', 'house', 'villa', 'condo', 'townhouse', 'land']).optional(), status: z.enum(['buy', 'rent']).optional(), isActive: z.boolean().optional() }).passthrough().default({}), expectedUpdatedAt: z.string().nullable().default(null) }).parse(req.body);
    const id = z.string().regex(/^[a-zA-Z0-9_-]{1,150}$/).parse(req.params.id);
    const property = await service.mutateProperty(body.operation, id, body.input, body.expectedUpdatedAt, req.user!.email || req.user!.id);
    console.info(JSON.stringify({ component: 'inventory', operation: body.operation, propertyId: id, actor: req.user!.id, requestId: res.locals.requestId }));
    res.json({ property });
  }));
  storageRouter.post('/billing/documents', asyncHandler(async (req, res) => {
    const document = z.object({ docNumber: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/), docType: z.enum(['sale_booking', 'commission', 'service', 'token_receipt']), pdfUrl: z.string().max(1200) }).passthrough().parse(req.body);
    res.status(201).json({ document: await service.appendBillingDocument(document) });
  }));
  storageRouter.post('/billing/number', asyncHandler(async (req, res) => {
    const type = z.enum(['sale_booking', 'commission', 'service', 'token_receipt']).parse(req.body.type);
    res.json({ number: await service.reserveDocumentNumber(type) });
  }));
  storageRouter.get('/object', asyncHandler(async (req, res) => {
    const path = pathSchema.parse(req.query.path);
    const content = await service.read(path);
    const snapshot = path === 'invoices/documents.json' ? await service.readVersion(path) : null;
    res.json(snapshot ? { ...snapshot } : { content });
  }));
  storageRouter.put('/object', asyncHandler(async (req, res) => {
    const input = z.object({ path: pathSchema, content: z.string().max(1_500_000), contentType: z.string().max(100).default('application/json'), revision: z.string().nullable().optional() }).parse(req.body);
    if (input.path === 'invoices/counters.json' || input.path.endsWith('/invoices/counters.json')) throw new StorageError(403, 'Document counters are managed by the server.');
    if (input.path === 'properties.json' || input.path.endsWith('/properties.json')) throw new StorageError(409, 'Use the per-property editor to avoid overwriting inventory.');
    if (input.path === 'invoices/documents.json' || input.path.endsWith('/invoices/documents.json')) throw new StorageError(409, 'Use the document generator to append billing history safely.');
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
