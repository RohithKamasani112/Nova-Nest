import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { S3Client } from '@aws-sdk/client-s3';

process.env.DATABASE_URL ||= 'postgres://unused:unused@localhost/unused';
process.env.JWT_SECRET ||= 'test-only-secret';
process.env.S3_BUCKET_NAME ||= 'test-only-bucket';
const settings = { bucket: 'test-only-bucket', folder: 'nova-site', region: 'us-east-1' };

test('storage paths cannot escape the backend namespace', async () => {
  const { normalizeStoragePath } = await import('../services/storageService');
  assert.equal(normalizeStoragePath('assets/flat/a.jpg', settings), 'assets/flat/a.jpg');
  assert.equal(normalizeStoragePath('nova-site/invoices/test.pdf', settings), 'invoices/test.pdf');
  assert.equal(normalizeStoragePath('https://test-only-bucket.s3.us-east-1.amazonaws.com/nova-site/invoices/test.pdf', settings), 'invoices/test.pdf');
  for (const path of ['../leads.json', '/assets/x.jpg', 'assets/../invoices/test.pdf', 'assets/x%252e.jpg', 'assets\\x.jpg', 'other-site/leads.json', 'crm-import-staging/test.json', 'users.json', 'https://evil.invalid/nova-site/invoices/test.pdf', 'https://test-only-bucket.s3.amazonaws.com/other-site/invoices/test.pdf']) {
    assert.throws(() => normalizeStoragePath(path, settings), path);
  }
});

test('public listing projection excludes hidden records and private fields', async () => {
  const { publicProperties } = await import('../services/storageService');
  const projected = publicProperties([{ id: 'active', title: 'Listing', images: [], ownerId: 'private-owner', commissionValue: 123, commissionType: 'fixed', adminNotes: 'private', isActive: true }, { id: 'inactive', isActive: false }]);
  assert.deepEqual(projected, [{ id: 'active', title: 'Listing', images: [], isActive: true }]);
});

test('stored media references remain portable and external images are not proxied', async () => {
  const { canonicalPropertyMedia } = await import('../services/storageService');
  const external = 'https://other-bucket.s3.us-east-1.amazonaws.com/other-site/image.jpg';
  const projected = canonicalPropertyMedia([{ images: [
    'https://test-only-bucket.s3.us-east-1.amazonaws.com/nova-site/assets/flat/photo.jpg',
    'https://old-api.invalid/api/public/storage/asset?path=assets%2Fflat%2Fsecond.jpg', external,
  ] }], settings);
  assert.deepEqual(projected, [{ images: ['assets/flat/photo.jpg', 'assets/flat/second.jpg', external] }]);
});

test('signed uploads enforce exact key, MIME, size, encryption and expiry without exposing the signing secret', async () => {
  const { createStorageService } = await import('../services/storageService');
  const signingSecret = 'local-unit-test-signing-secret';
  const client = new S3Client({ region: settings.region, credentials: { accessKeyId: 'LOCAL_TEST_KEY', secretAccessKey: signingSecret } });
  const service = createStorageService(client, () => settings);
  const signed = await service.upload('assets/flat/photo.jpg', 'image/jpeg', 1234);
  const policy = JSON.parse(Buffer.from(signed.fields.Policy, 'base64').toString('utf8'));
  assert.equal(signed.fields.key, 'nova-site/assets/flat/photo.jpg');
  assert.equal(signed.fields['Content-Type'], 'image/jpeg');
  assert(policy.conditions.some((condition: unknown) => JSON.stringify(condition) === JSON.stringify(['content-length-range', 1234, 1234])));
  assert.equal(signed.fields['x-amz-server-side-encryption'], 'AES256');
  assert.equal(signed.expiresIn, 300);
  assert(!JSON.stringify(signed).includes(signingSecret));
  for (const [path, type, size] of [['assets/x.html', 'text/html', 100], ['assets/x.svg', 'image/svg+xml', 100], ['invoices/x.pdf', 'image/jpeg', 100], ['properties.json', 'application/json', 100], ['assets/x.jpg', 'image/jpeg', 0], ['assets/x.jpg', 'image/jpeg', 11 * 1024 * 1024]] as const) {
    await assert.rejects(service.upload(path, type, size));
  }
  await assert.rejects(service.download('invoices/test.pdf', true), /Asset not found/);
  await assert.rejects(service.download('assets/script.html', true), /Unsupported asset type/);
  const url = await service.download('invoices/test.pdf');
  assert.equal(new URL(url).searchParams.get('X-Amz-Expires'), '300');
  assert(!url.includes(signingSecret));
  client.destroy();
});

test('object operations scope every command and reject unsafe writes/deletes/listing', async () => {
  const { createStorageService, StorageError } = await import('../services/storageService');
  const commands: any[] = [];
  const client = new S3Client({ region: settings.region });
  (client as any).send = async (command: any) => {
    commands.push(command.input);
    if (command.constructor.name === 'GetObjectCommand') return { Body: { transformToString: async () => '[]' } };
    if (command.constructor.name === 'ListObjectsV2Command') return { Contents: [{ Key: 'nova-site/property-shares/a.json' }] };
    return {};
  };
  const service = createStorageService(client, () => settings);
  assert.equal(await service.read('leads.json'), '[]');
  await service.write('properties.json', '[]', 'text/html');
  assert.equal(commands[1].ContentType, 'application/json');
  await service.remove('assets/flat/photo.jpg');
  assert.deepEqual(await service.list('property-shares/'), ['nova-site/property-shares/a.json']);
  assert(commands.every(command => command.Bucket === settings.bucket && (command.Key ?? command.Prefix).startsWith('nova-site/')));
  await assert.rejects(service.write('assets/script.js', 'x', 'application/javascript'), StorageError);
  await assert.rejects(service.write('properties.json', '{}', 'application/json'), StorageError);
  await assert.rejects(service.remove('properties.json'), StorageError);
  await assert.rejects(service.list('invoices/'), StorageError);
  client.destroy();
});

test('HTTP storage endpoints require admin access, sanitize public responses and hide private files', async () => {
  const express = (await import('express')).default;
  const { createStorageRouters } = await import('../routes/storage');
  const { createStorageService } = await import('../services/storageService');
  const client = new S3Client({ region: settings.region, credentials: { accessKeyId: 'LOCAL_TEST_KEY', secretAccessKey: 'local-test-secret' } });
  const commands: any[] = [];
  (client as any).send = async (command: any) => {
    commands.push(command.input);
    return { Body: { transformToString: async () => JSON.stringify([{ id: 'public', title: 'Public listing', ownerId: 'hidden', commissionCalculated: 999, isActive: true }]) }, Contents: [] };
  };
  const service = createStorageService(client, () => settings);
  const routers = createStorageRouters(service, (req, res, next) => {
    const role = req.headers.authorization;
    if (!role) return res.status(401).json({ error: 'Login required.' });
    req.user = { id: 'test-user', email: 'test@example.com', role, source_scope: [], agent_id: null, session_version: 0 };
    next();
  });
  const app = express(); app.use(express.json());
  app.use('/api/storage', routers.storageRouter); app.use('/api/public/storage', routers.publicStorageRouter);
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  const request = async (route: string, role?: string, method = 'GET', body?: unknown) => fetch(base + route, { method,
    headers: { ...(role ? { Authorization: role } : {}), 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
  try {
    for (const role of [undefined, 'agent', 'telecaller']) for (const [route, method, body] of [
      ['/storage/object?path=leads.json', 'GET', undefined],
      ['/storage/object', 'PUT', { path: 'properties.json', content: '[]' }],
      ['/storage/upload', 'POST', { path: 'assets/x.jpg', contentType: 'image/jpeg', size: 100 }],
      ['/storage/download', 'POST', { path: 'invoices/test.pdf' }],
      ['/storage/list?prefix=property-shares/', 'GET', undefined],
      ['/storage/object?path=assets/x.jpg', 'DELETE', undefined],
    ] as const) assert.equal((await request(route, role, method, body)).status, role ? 403 : 401);
    assert.equal(commands.length, 0, 'Denied requests must not reach S3');
    const publicResult = await request('/public/storage/properties');
    assert.equal(publicResult.status, 200);
    assert.deepEqual(await publicResult.json(), [{ id: 'public', title: 'Public listing', isActive: true }]);
    assert.equal((await request('/public/storage/asset?path=invoices/test.pdf')).status, 404);
    assert.equal((await request('/public/storage/asset?path=../leads.json')).status, 400);
    const media = await request('/public/storage/asset?path=assets/flat/photo.jpg');
    assert.equal(media.status, 302); assert(media.headers.get('location')?.includes('X-Amz-Signature'));
    assert.equal((await request('/storage/object?path=leads.json', 'admin')).status, 200);
    assert.equal((await request('/storage/object', 'admin', 'PUT', { path: 'properties.json', content: '[]' })).status, 204);
    assert.equal((await request('/storage/upload', 'admin', 'POST', { path: 'assets/x.jpg', contentType: 'image/jpeg', size: 100 })).status, 200);
    assert.equal((await request('/storage/download', 'admin', 'POST', { path: 'invoices/test.pdf' })).status, 200);
    assert.equal((await request('/storage/object?path=crm-import-staging/a.json', 'admin')).status, 400);
    assert.equal((await request('/storage/upload', 'admin', 'POST', { path: 'assets/x.html', contentType: 'text/html', size: 100 })).status, 400);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    client.destroy();
    const { pool } = await import('../db/pool'); await pool.end();
  }
});
