import assert from 'node:assert/strict';

// Exercise the transaction without connecting to a real database.
process.env.DATABASE_URL ||= 'postgres://unused:unused@localhost/unused';
process.env.JWT_SECRET ||= 'test-only-secret';
process.env.S3_BUCKET_NAME ||= 'test-only-bucket';

async function main() {
  const { pool } = await import('../db/pool');
  const { upsertSalesAccount, SalesAccountConflictError } = await import('../services/authService');
  const originalConnect = pool.connect;
  let calls: { sql: string; params?: unknown[] }[] = [];
  let role: string | null = 'admin';
  let released = false;
  let failInsert = false;
  (pool as any).connect = async () => ({
    query: async (sql: string, params?: unknown[]) => {
      calls.push({ sql, params });
      if (sql.startsWith('SELECT role')) return { rows: role ? [{ role }] : [] };
      if (sql.includes('INSERT INTO users')) {
        if (failInsert) throw new Error('simulated insert failure');
        return { rows: [{ email: params![0] }] };
      }
      return { rows: [] };
    },
    release: () => { released = true; },
  });
  try {
    await assert.rejects(upsertSalesAccount('admin@example.com', 'test-password'), SalesAccountConflictError);
    assert(!calls.some(c => c.sql.includes('INSERT INTO users')), 'Admin credentials must never be overwritten');
    assert(calls.some(c => c.sql === 'ROLLBACK'));
    assert(released);

    calls = []; released = false; role = null;
    assert.deepEqual(await upsertSalesAccount('SALES@example.com', 'test-password'), { email: 'sales@example.com' });
    assert(calls.some(c => c.sql.includes('pg_advisory_xact_lock')));
    assert(calls.some(c => c.sql.includes('is_active = false') && c.params?.[0] === 'sales@example.com'));
    assert(calls.some(c => c.sql === 'COMMIT'));
    assert(released);

    calls = []; released = false; failInsert = true; role = 'sales';
    await assert.rejects(upsertSalesAccount('sales@example.com', 'test-password'), /simulated insert failure/);
    assert(calls.some(c => c.sql === 'ROLLBACK'));
    assert(!calls.some(c => c.sql === 'COMMIT'));
    assert(released);
    console.log('Sales account regression checks passed (admin protection, update, rollback).');
  } finally {
    pool.connect = originalConnect;
    await pool.end();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
