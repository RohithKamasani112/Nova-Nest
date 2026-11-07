import { test } from 'node:test';
import assert from 'node:assert/strict';
import { S3Client } from '@aws-sdk/client-s3';
process.env.DATABASE_URL ||= 'postgres://unused:unused@localhost/unused';
process.env.JWT_SECRET ||= 'test-only-secret';
process.env.S3_BUCKET_NAME ||= 'test-only-bucket';
async function fixture() {
  const { createStorageService } = await import('../services/storageService');
  const client = new S3Client({ region: 'us-east-1' });
  const objects = new Map<string, { content: string; revision: string }>();
  let revision = 0;
  (client as any).send = async (command: any) => {
    const input = command.input; const existing = objects.get(input.Key);
    if (command.constructor.name === 'GetObjectCommand') {
      if (!existing) throw Object.assign(new Error(), { name: 'NoSuchKey' });
      return { ETag: existing.revision, Body: { transformToString: async () => existing.content } };
    }
    if (command.constructor.name === 'PutObjectCommand') {
      if ((input.IfNoneMatch && existing) || (input.IfMatch && input.IfMatch !== existing?.revision)) throw Object.assign(new Error(), { name: 'PreconditionFailed' });
      objects.set(input.Key, { content: input.Body, revision: String(++revision) }); return {};
    }
    throw new Error('Unexpected command');
  };
  const service = createStorageService(client, () => ({ bucket: 'test-only-bucket', folder: 'site', region: 'us-east-1' }));
  return { service, client, objects };
}
const listing = { title: 'Test home', price: 25000, locality: 'Hoodi', location: 'Hoodi, Bengaluru', description: 'A test listing', images: ['assets/home/a.jpg'], areaSqft: 1200, isActive: true };
test('stale property edits fail instead of overwriting a newer price', async () => {
  const { service, client } = await fixture();
  try {
    const created = await service.mutateProperty('create', 'a', listing, null, 'admin-a');
    const changed = await service.mutateProperty('update', 'a', { price: 27000 }, created.updatedAt, 'admin-b');
    await assert.rejects(service.mutateProperty('update', 'a', { price: 26000 }, created.updatedAt, 'admin-a'), /another user/);
    assert.equal(JSON.parse(await service.read('properties.json'))[0].price, 27000);
    assert.equal(changed.history[1].actor, 'admin-b');
  } finally { client.destroy(); }
});
test('archive and restore retain media and restore as inactive', async () => {
  const { service, client } = await fixture();
  try {
    const created = await service.mutateProperty('create', 'a', listing, null, 'admin');
    await assert.rejects(service.mutateProperty('delete', 'a', {}, created.updatedAt, 'admin'), /Archive/);
    const archived = await service.mutateProperty('archive', 'a', {}, created.updatedAt, 'admin');
    assert.equal(archived.isActive, false); assert(archived.archivedAt);
    const restored = await service.mutateProperty('restore', 'a', {}, archived.updatedAt, 'admin');
    assert.equal(restored.archivedAt, undefined); assert.equal(restored.isActive, false); assert.deepEqual(restored.images, listing.images);
    assert.deepEqual(restored.history.map((h: any) => h.operation), ['create', 'archive', 'restore']);
  } finally { client.destroy(); }
});
test('concurrent independent edits preserve both properties', async () => {
  const { service, client } = await fixture();
  try {
    const a = await service.mutateProperty('create', 'a', listing, null, 'admin');
    const b = await service.mutateProperty('create', 'b', listing, null, 'admin');
    await Promise.all([service.mutateProperty('update', 'a', { price: 1 }, a.updatedAt, 'admin'), service.mutateProperty('update', 'b', { price: 2 }, b.updatedAt, 'admin')]);
    const properties = JSON.parse(await service.read('properties.json'));
    assert.equal(properties.find((p: any) => p.id === 'a').price, 1); assert.equal(properties.find((p: any) => p.id === 'b').price, 2);
  } finally { client.destroy(); }
});
test('publication requires location, price, size and media', async () => {
  const { service, client } = await fixture();
  try { for (const patch of [{ locality: '' }, { price: 0 }, { areaSqft: 0 }, { images: [] }]) await assert.rejects(service.mutateProperty('create', 'bad', { ...listing, ...patch }, null, 'admin')); }
  finally { client.destroy(); }
});
test('parallel number reservations are unique and continue historical documents', async () => {
  const { service, client, objects } = await fixture();
  try {
    const year = new Date().getUTCFullYear();
    objects.set('site/invoices/documents.json', { content: JSON.stringify([{ docNumber: `NN-SERV-${year}-015` }]), revision: 'seed' });
    const numbers = await Promise.all(Array.from({ length: 5 }, () => service.reserveDocumentNumber('service')));
    assert.equal(new Set(numbers).size, 5); assert(numbers.every(n => Number(n.slice(-3)) > 15));
    assert.equal(await service.reserveDocumentNumber('token_receipt'), 'NONN0604');
  } finally { client.destroy(); }
});
test('parallel billing appends preserve both documents and reject duplicate numbers', async () => {
  const { service, client } = await fixture();
  try {
    await Promise.all(['A','B'].map(docNumber => service.appendBillingDocument({ docNumber, docType: 'service', pdfUrl: `invoices/${docNumber}.pdf` })));
    assert.equal(JSON.parse(await service.read('invoices/documents.json')).length, 2);
    await assert.rejects(service.appendBillingDocument({ docNumber: 'A' }), /already exists/);
  } finally { client.destroy(); }
});
