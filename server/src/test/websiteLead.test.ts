import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';

process.env.DATABASE_URL ||= 'postgres://unused:unused@localhost/unused';
process.env.JWT_SECRET ||= 'test-only-secret';
process.env.S3_BUCKET_NAME ||= 'test-only-bucket';

async function main() {
  const express = (await import('express')).default;
  const { pool } = await import('../db/pool');
  const { publicLeadsRouter } = await import('../routes/publicLeads');
  const originalQuery = pool.query;
  const calls: { sql: string; params: unknown[] }[] = [];
  (pool as any).query = async (sql: string, params: unknown[] = []) => {
    calls.push({ sql, params });
    return { rows: sql.includes('INSERT INTO leads') ? [{ id: 'website-lead-1' }] : [] };
  };
  const app = express();
  app.use(express.json());
  app.use('/api/public/leads', publicLeadsRouter);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  try {
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/public/leads`;
    const response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Website Visitor', phone: '+91 98765 43210', email: 'visitor@example.com', message: 'Please arrange a site visit', project: 'nova-property-1', leadType: 'schedule-visit' }),
    });
    assert.equal(response.status, 201, 'Public intake works without an admin login');
    assert.deepEqual(await response.json(), { id: 'website-lead-1' });
    const insert = calls.find(call => call.sql.includes('INSERT INTO leads'))!;
    assert(insert.sql.includes("'website'"), 'Website enquiries use the dedicated CRM source');
    assert(insert.params.includes('9876543210'), 'Phone number is normalized');
    assert(insert.params.includes('Please arrange a site visit'), 'Original enquiry is preserved');
    assert(insert.params.includes('nova-property-1'), 'Property context is preserved');
    const before = calls.length;
    const invalid = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Missing phone' }) });
    assert.equal(invalid.status, 400);
    assert.equal(calls.length, before, 'Invalid enquiries must not reach the database');
    console.log('Website lead integration checks passed (public route, CRM source, contact, message, validation; database mocked).');
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    pool.query = originalQuery;
    await pool.end();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
