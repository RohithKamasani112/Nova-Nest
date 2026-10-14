import assert from 'node:assert/strict';
process.env.DATABASE_URL ||= 'postgres://unused:unused@localhost/unused';
process.env.JWT_SECRET ||= 'test-only-secret';
process.env.S3_BUCKET_NAME ||= 'test-only-bucket';
async function main() {
  const { pool } = await import('../db/pool');
  const { getSalesAccountEmail, upsertSalesAccount, SalesAccountConflictError } = await import('../services/authService');
  const original = pool.query;
  (pool as any).query = () => { throw new Error('Retired accounts must not write to the database'); };
  try {
    assert.equal(await getSalesAccountEmail(), null);
    await assert.rejects(upsertSalesAccount('old@example.com', 'test-password'), SalesAccountConflictError);
    console.log('Legacy shared login is retired and cannot overwrite credentials.');
  } finally { pool.query = original; await pool.end(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
