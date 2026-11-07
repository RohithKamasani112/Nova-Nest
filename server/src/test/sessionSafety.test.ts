import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL ||= 'postgres://unused:unused@localhost/unused';
process.env.JWT_SECRET ||= 'test-only-secret';
process.env.S3_BUCKET_NAME ||= 'test-only-bucket';
test('disabled/revoked sessions and detached agent accounts cannot access protected routes', async () => {
  const { pool } = await import('../db/pool'); const original = pool.query;
  const { requireAuth } = await import('../middleware/requireAuth'); const { signAuthToken } = await import('../lib/jwt');
  const token = signAuthToken({ sub: 'test-user', email:'test@example.com', role:'admin', sessionVersion:1 });
  const invoke = async (identity: any) => {
    (pool as any).query = async () => ({rows: identity ? [identity] : []});
    let status = 0; let proceeded = false;
    const request: any = {headers:{authorization:`Bearer ${token}`}};
    const response: any = {status(value:number){status=value;return this;},json(){return this;}};
    await requireAuth(request,response,()=>{proceeded=true;}); return {status,proceeded,user:request.user};
  };
  const base = {id:'test-user',email:'test@example.com',role:'admin',source_scope:[],agent_id:null,session_version:1};
  try {
    assert.equal((await invoke(null)).status,401);
    assert.equal((await invoke({...base,session_version:2})).status,401);
    assert.equal((await invoke({...base,role:'agent'})).status,401);
    const current=await invoke({...base,role:'telecaller',source_scope:['website']});
    assert.equal(current.proceeded,true); assert.equal(current.user.role,'telecaller','Current database role takes precedence over the token');
  } finally {pool.query=original;await pool.end();}
});
