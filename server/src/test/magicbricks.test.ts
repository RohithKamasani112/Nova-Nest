import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createHandler } from '../integrations/magicbricks/handler';
import { createKeyProvider, matchesKey } from '../integrations/magicbricks/auth';
import { parsePayload } from '../integrations/magicbricks/parser';
import { validateLead } from '../integrations/magicbricks/validator';
import { createPostgresRepository, dedupeKey } from '../integrations/magicbricks/repository';
import { MESSAGES } from '../integrations/magicbricks/responses';
import type { PushEvent } from '../integrations/magicbricks/types';

const key = randomBytes(32).toString('hex');
const fields = { name: ' Ashok Raj ', mobile: '+91 97911 55555', email: 'A@B.com', source: 'Magic Bricks', project: 'Plaza Bounty Acres', isd: 'Plaza Bounty Acres', dt: '20180722', time: '145000', msg: 'Please call\u0000 me', city: ' Chennai ' };
const now = new Date('2026-10-13T10:00:00Z');
const event = (overrides: Partial<PushEvent> = {}): PushEvent => ({ rawPath: '/api/leads/create', httpMethod: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': key }, body: JSON.stringify(fields), ...overrides });

test('query sample, URL decoding and base64 JSON alternate shape', () => {
  const query = new URLSearchParams({ ...fields, api_key: key }).toString();
  const lead = validateLead(parsePayload(event({ body: null, rawQueryString: query })), now);
  assert.equal(lead.mobile, '9791155555'); assert.equal(lead.email, 'a@b.com');
  assert.equal(lead.lead_dt, '2018-07-22T09:20:00.000Z'); assert.equal(lead.received_at, now.toISOString());
  assert.equal(lead.country_code, '91'); assert.equal(lead.raw_isd, fields.isd); assert(!('api_key' in lead.raw_payload));
  assert.equal(lead.message, 'Please call  me');
  const json = { responderName: 'Ashok Raj', responderPhone: '09791155555', responderEmail: 'A@B.COM', projectName: 'Plaza Bounty Acres', comments: 'A%26B' };
  const alternate = validateLead(parsePayload(event({ isBase64Encoded: true, body: Buffer.from(JSON.stringify(json)).toString('base64') })), now);
  assert.equal(alternate.mobile, lead.mobile); assert.equal(alternate.message, 'A%26B'); assert.equal(alternate.lead_dt, now.toISOString());
});
test('form fields, mixed case keys, UTC receive time, numeric country code', () => {
  const lead = validateLead(parsePayload(event({ headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'NaMe=Joe&Mobile=00919791155555&PROJECT=Hello%20World&ISD=91&City=Chennai' })), now);
  assert.equal(lead.name, 'Joe'); assert.equal(lead.project, 'Hello World'); assert.equal(lead.mobile, '9791155555'); assert.equal(lead.raw_isd, null);
});
test('bad dates, rollover, times, contacts and missing required fields are rejected', () => {
  for (const patch of [{dt:'20260230'}, {dt:'20261301'}, {time:'240000'}, {time:'126100'}, {email:'no-at'}, {mobile:'123'}, {mobile:'abcdef9791155555'}, {isd:'44'}, {name:''}, {project:''}]) {
    assert.throws(() => validateLead(parsePayload(event({body:JSON.stringify({...fields,...patch})})),now));
  }
  assert.equal(validateLead(parsePayload(event({body:JSON.stringify({...fields,dt:'20240229',time:'000000'})})),now).lead_dt,'2024-02-28T18:30:00.000Z');
});
test('payload limits, nested objects and repeated/colliding keys fail safely', () => {
  for (const bad of [event({body:'{'}), event({body:'[]'}), event({body:'{"NAME":"A","name":"B"}'}), event({rawQueryString:'name=A',body:'{"Name":"B"}'}), event({body:'{"name":{}}'}), event({body:' '.repeat(10241)}), event({body:'',rawQueryString:'a='.repeat(6000)})]) assert.throws(()=>parsePayload(bad));
});
test('constant-time digest matching and rotation cache', async () => {
  const old = randomBytes(32).toString('hex');
  assert(matchesKey(old,[key,old])); assert(!matchesKey('wrong',[key])); assert(!matchesKey(undefined,[key]));
  let reads=0; const provider=createKeyProvider(async()=>{reads++;return JSON.stringify({active:key,keys:[old]});});
  const [a,b]=await Promise.all([provider(),provider()]); assert.deepEqual(a,b); assert.equal(reads,1);
  assert(matchesKey(old,await provider()));
  await assert.rejects(createKeyProvider(async()=>'{"keys":[]}')());
});
test('exact success, duplicate, unauthorized and validation responses; safe logs', async () => {
  const saved = new Set<string>(); const logs: Record<string,unknown>[]=[];
  const handler=createHandler({keys:async()=>[key],now:()=>now,log:x=>logs.push(x),repository:{save:async lead=>{const k=dedupeKey(lead);if(saved.has(k))return 'duplicate';saved.add(k);return 'created';}}});
  assert.equal((await handler(event())).body,MESSAGES.created);
  assert.equal((await handler(event({httpMethod:'GET',body:null,rawQueryString:new URLSearchParams({...fields,api_key:key}).toString(),headers:{}}))).body,MESSAGES.duplicate);
  assert.equal(saved.size,1);
  for(const headers of [{},{'x-api-key':'wrong'}]) {const r=await handler(event({headers}));assert.equal(r.statusCode,401);assert.equal(r.body,MESSAGES.unauthorized);}
  const conflict=await handler(event({rawQueryString:'api_key=wrong'}));assert.equal(conflict.statusCode,401);
  const bad=await handler(event({body:JSON.stringify({...fields,project:''})}));assert.equal(bad.statusCode,400);
  const serialized=JSON.stringify(logs); for(const privateValue of [key,fields.name.trim(),fields.email,fields.mobile,'9791155555',fields.project])assert(!serialized.includes(privateValue));
  assert(serialized.includes('******5555'));
});
test('database and secret failures return only the required 500 body', async () => {
  const fail=async()=>{throw new Error('PRIVATE database password and payload');};
  for(const deps of [{keys:fail,repository:{save:async()=> 'created' as const}},{keys:async()=>[key],repository:{save:fail}}]) {
    const logs:unknown[]=[]; const handler=createHandler({...deps,log:x=>logs.push(x)});const result=await handler(event());
    assert.equal(result.statusCode,500); assert.equal(result.body,MESSAGES.internal);assert(!JSON.stringify(logs).includes('PRIVATE'));
  }
});
test('dedupe is insensitive to project casing and configurable', () => {
  const lead=validateLead(parsePayload(event()),now);
  assert.equal(dedupeKey(lead),dedupeKey({...lead,project:'  PLAZA BOUNTY ACRES '}));
  assert.notEqual(dedupeKey(lead),dedupeKey({...lead,project:'Another project'}));
  assert.notEqual(dedupeKey(lead),dedupeKey(lead,'source_mobile_project'));assert.throws(()=>dedupeKey(lead,'bad'));
});
test('repository short-circuits duplicate claims without inserting another lead',async()=>{
  const queries:string[]=[];const repository=createPostgresRepository(async fn=>fn({query:async(sql:string)=>{queries.push(sql);return {rows:[]};}} as any));
  assert.equal(await repository.save(validateLead(parsePayload(event()),now)),'duplicate');assert(!queries.some(sql=>sql.includes('INSERT INTO leads')));
});
