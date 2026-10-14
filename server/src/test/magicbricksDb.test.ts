import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
import { createPostgresRepository } from '../integrations/magicbricks/repository';
import { validateLead } from '../integrations/magicbricks/validator';

test('real PostgreSQL: parallel retries, distinct projects, rollback, and existing contacts', {skip:!process.env.MAGICBRICKS_TEST_DATABASE_URL}, async()=>{
  const schema='magicbricks_test_'+randomBytes(8).toString('hex');
  const admin=new Pool({connectionString:process.env.MAGICBRICKS_TEST_DATABASE_URL});
  await admin.query('CREATE SCHEMA '+schema);
  const pool=new Pool({connectionString:process.env.MAGICBRICKS_TEST_DATABASE_URL,options:'-c search_path='+schema+',public',max:10});
  try{
    for(const file of fs.readdirSync(path.resolve(__dirname,'../../src/db/migrations')).filter(x=>x.endsWith('.sql')).sort()) {
      const up=fs.readFileSync(path.resolve(__dirname,'../../src/db/migrations',file),'utf8').split('-- Down Migration')[0];await pool.query(up);
    }
    const repository=createPostgresRepository(async fn=>{
      const client=await pool.connect();try{await client.query('BEGIN');const result=await fn(client);await client.query('COMMIT');return result;}
      catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
    });
    const lead=validateLead({name:'Test Visitor',mobile:'9876543210',project:'Test Project'});
    const results=await Promise.all(Array.from({length:12},()=>repository.save(lead)));
    assert.equal(results.filter(x=>x==='created').length,1);assert.equal(results.filter(x=>x==='duplicate').length,11);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM leads')).rows[0].n,1);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM integration_lead_dedupe')).rows[0].n,1);
    assert.equal(await repository.save({...lead,project:'TEST PROJECT'}),'duplicate');
    assert.equal(await repository.save({...lead,project:'Another project'}),'created');
    const other=(await pool.query("SELECT * FROM leads WHERE project_name='Another project'")).rows[0];assert.equal(other.is_duplicate,true);assert(other.duplicate_of_id);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM lead_duplicates WHERE matched_on='phone'")).rows[0].n,1,'Existing CRM multi-interest badge must track the new project enquiry');
    // Same phone with distinct projects concurrently still respects CRM contact uniqueness.
    const parallel=await Promise.all(['P1','P2'].map(project=>repository.save({...lead,mobile:'9876543211',project})));
    assert.deepEqual(parallel,['created','created']);
    await pool.query("CREATE FUNCTION reject_test_lead() RETURNS trigger AS $$ BEGIN IF NEW.project_name='Reject' THEN RAISE EXCEPTION 'test failure'; END IF; RETURN NEW; END; $$ LANGUAGE plpgsql");
    await pool.query('CREATE TRIGGER reject_test_lead BEFORE INSERT ON leads FOR EACH ROW EXECUTE FUNCTION reject_test_lead()');
    const before=(await pool.query('SELECT count(*)::int AS n FROM integration_lead_dedupe')).rows[0].n;
    await assert.rejects(repository.save({...lead,project:'Reject'}));
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM integration_lead_dedupe')).rows[0].n,before,'Failed writes must not leave a dedupe claim');
    await pool.query('DROP TRIGGER reject_test_lead ON leads');
    assert.equal(await repository.save({...lead,project:'Reject'}),'created');
    // Housing shares the CRM table and detects old portal/import enquiries too.
    assert.equal(await repository.save({...lead,source:'housing'}),'duplicate');
    const housingLead = {...lead,source:'housing' as const,mobile:'9876543222',project:'Housing project',city:'Hyderabad',message:''};
    const housingResults=await Promise.all(Array.from({length:8},()=>repository.save(housingLead)));
    assert.equal(housingResults.filter(x=>x==='created').length,1);
    assert.equal(housingResults.filter(x=>x==='duplicate').length,7);
    const stored=(await pool.query("SELECT source,city,message FROM leads WHERE phone='9876543222'")).rows;
    assert.deepEqual(stored,[{source:'housing',city:'Hyderabad',message:''}]);
    assert.equal(await repository.save({...housingLead,project:'HOUSING PROJECT'}),'duplicate');
    const claim=(await pool.query("SELECT count(*)::int AS n FROM integration_lead_dedupe WHERE provider='housing'")).rows[0].n;
    assert.equal(claim,2);
  }finally{
    await pool.end();await admin.query('DROP SCHEMA '+schema+' CASCADE');await admin.end();
  }
});
