import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createHandler as housingHandler } from '../integrations/housing/handler';
import { createHandler as magicbricksHandler } from '../integrations/magicbricks/handler';
import { dedupeKey } from '../integrations/shared/repository';
import { redactedRequest } from '../integrations/shared/requestLog';
import { NormalizedLead, PushEvent } from '../integrations/shared/types';

const housingKey = randomBytes(32).toString('hex');
const magicKey = randomBytes(32).toString('hex');
const fields = { name: ' Test Lead ', email: 'TEST@example.com', isd: '+91', mobile: '99999-99999', project: 'Test Project', city: 'Hyderabad' };
const event = (overrides: Partial<PushEvent> = {}): PushEvent => ({ rawPath: '/api/leads/create/housing', httpMethod: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': housingKey }, body: JSON.stringify(fields), ...overrides });
function setup() {
  const leads: NormalizedLead[] = [], logs: Record<string, unknown>[] = [];
  const repository = { save: async (lead: NormalizedLead) => {
    if (leads.some(saved => dedupeKey(saved) === dedupeKey(lead))) return 'duplicate' as const;
    leads.push(lead); return 'created' as const;
  } };
  return { leads, logs, housing: housingHandler({ keys: async () => [housingKey], repository, log: entry => logs.push(entry) }), magic: magicbricksHandler({ keys: async () => [magicKey], repository, log: entry => logs.push(entry) }) };
}
test('Housing maps fields, normalizes phone, stores city and forces source', async () => {
  const { housing, leads } = setup();
  const response = await housing(event({ body: JSON.stringify({ ...fields, source: 'magicbricks' }) }));
  assert.equal(response.statusCode, 200); assert.match(response.headers['Content-Type'], /^application\/json/);
  assert.deepEqual(JSON.parse(response.body), { status: 'success', message: 'Lead punched in the CRM' });
  assert.equal(leads[0].source, 'housing'); assert.equal(leads[0].name, 'Test Lead');
  assert.equal(leads[0].mobile, '9999999999'); assert.equal(leads[0].email, 'test@example.com');
  assert.equal(leads[0].city, 'Hyderabad'); assert.equal(leads[0].project, 'Test Project'); assert.equal(leads[0].message, '');
});
test('Housing retries with different phone formatting produce exact JSON duplicate response', async () => {
  const { housing, leads } = setup(); await housing(event());
  for (const mobile of ['+91 99999 99999', '919999999999', '09999999999', '00919999999999']) {
    const result = await housing(event({ body: JSON.stringify({ ...fields, mobile, project: 'TEST PROJECT' }) }));
    assert.equal(result.statusCode, 200); assert.deepEqual(JSON.parse(result.body), { status: 'failure', message: 'Lead already exist' });
  }
  assert.equal(leads.length, 1);
});
test('Housing missing/invalid phone is a clear 400 and does not save', async () => {
  const { housing, leads } = setup();
  for (const mobile of ['', '123', 'abc9999999999']) {
    const result = await housing(event({ body: JSON.stringify({ ...fields, mobile }) }));
    assert.equal(result.statusCode, 400); assert.match(JSON.parse(result.body).message, /Phone required|Invalid mobile/);
  }
  assert.equal(leads.length, 0);
});
test('Housing key accepted in header, query, JSON and form; priority is header > query > body', async () => {
  const cases = [
    event(),
    event({ headers: { 'content-type': 'application/json' }, rawQueryString: 'api_key=' + housingKey }),
    event({ headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...fields, api_key: housingKey }) }),
    event({ headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-API-Key': housingKey }, body: new URLSearchParams(fields).toString() }),
    event({ rawQueryString: 'api_key=ignored-bad-query', body: JSON.stringify({ ...fields, api_key: 'ignored-bad-body' }) }),
    event({ headers: { 'content-type': 'application/json' }, rawQueryString: 'api_key=' + housingKey, body: JSON.stringify({ ...fields, api_key: 'ignored-bad-body' }) }),
  ];
  for (const request of cases) assert.equal(JSON.parse((await setup().housing(request)).body).status, 'success');
  for (const request of [event({ headers: {} }), event({ headers: { 'x-api-key': magicKey } }), event({ headers: { 'x-api-key': 'wrong' }, rawQueryString: 'api_key=' + housingKey }), event({ headers: {}, rawQueryString: 'api_key=wrong', body: JSON.stringify({ ...fields, api_key: housingKey }) })]) {
    const result = await setup().housing(request); assert.equal(result.statusCode, 401); assert.equal(JSON.parse(result.body).message, 'Unauthorized');
  }
});
test('Housing logs incoming headers and body with credentials redacted, even on rejected requests', async () => {
  const { housing, logs } = setup();
  await housing(event({ headers: { 'x-api-key': housingKey, authorization: 'private-auth', cookie: 'private-cookie', 'content-type': 'application/json' }, rawQueryString: 'api_key=' + magicKey, body: JSON.stringify({ ...fields, api_key: magicKey, comments: 'Key echo: ' + housingKey }) }));
  const incoming = logs.find(log => log.outcome === 'incoming_request')!;
  assert(incoming.requestId); assert.equal((incoming.body as Record<string, string>).city, 'Hyderabad');
  const text = JSON.stringify(logs); for (const secret of [housingKey, magicKey, 'private-auth', 'private-cookie']) assert(!text.includes(secret));
  assert(text.includes('[REDACTED]'));
  const nested = JSON.stringify(redactedRequest(event({ body: JSON.stringify({ nested: { API_KEY: housingKey }, api_key: magicKey }) })));
  assert(!nested.includes(housingKey)); assert(!nested.includes(magicKey));
  const malformed = JSON.stringify(redactedRequest(event({ body: '{"api_key":"' + housingKey })));
  assert(!malformed.includes(housingKey)); assert(malformed.includes('unparseable body'));
});
test('Housing form/query casing and base64 body work', async () => {
  const body = JSON.stringify({ ...fields, comments: 'Call me today', api_key: housingKey });
  const { housing, leads } = setup();
  assert.equal((await housing(event({ headers: { 'content-type': 'application/json' }, body: Buffer.from(body).toString('base64'), isBase64Encoded: true }))).statusCode, 200);
  assert.equal(leads[0].message, 'Call me today');
});
test('Housing unexpected failures return JSON without exposing database details', async () => {
  const handler = housingHandler({ keys: async () => [housingKey], repository: { save: async () => { throw new Error('private details'); } }, log: () => {} });
  const result = await handler(event()); assert.equal(result.statusCode, 500);
  assert.deepEqual(JSON.parse(result.body), { status: 'failure', message: 'Internal error' });
});
test('Legacy Magicbricks and /magicbricks alias retain plain text, keys and duplicate behavior', async () => {
  const { magic, housing } = setup();
  const request = event({ rawPath: '/api/leads/create', headers: { 'content-type': 'application/json', 'x-api-key': magicKey }, body: JSON.stringify({ responderName: 'Test', responderPhone: '9999999999', projectName: 'Legacy project', source: 'magicbricks', comments: 'legacy' }) });
  const saved = await magic(request); assert.equal(saved.body, 'Success: Lead punched in the CRM'); assert.match(saved.headers['Content-Type'], /^text\/plain/);
  assert.equal((await magic({ ...request, rawPath: '/api/leads/create/magicbricks' })).body, 'Failure: Lead already exist');
  assert.equal((await magic({ ...request, headers: { 'x-api-key': housingKey } })).statusCode, 401);
  assert.equal((await housing(event({ headers: { 'x-api-key': magicKey } }))).statusCode, 401);
  const get = await magic({ ...request, httpMethod: 'GET', rawPath: '/api/leads/create/magicbricks', body: null, headers: {}, rawQueryString: new URLSearchParams({ name: 'Test', mobile: '9999999999', project: 'Legacy project', api_key: magicKey }).toString() });
  assert.equal(get.body, 'Failure: Lead already exist');
});
