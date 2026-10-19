import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler as magicbricksHandler } from '../integrations/magicbricks/handler';
import { createHandler as housingHandler } from '../integrations/housing/handler';
import type { NormalizedLead, PushEvent } from '../integrations/shared/types';

const key = 'local-test-key-for-bhk-validation-only';
const contact = { name: 'BHK test', mobile: '9876543210', project: 'Test project' };

for (const [provider, createHandler] of [['magicbricks', magicbricksHandler], ['housing', housingHandler]] as const) {
  test(`${provider} accepts optional BHK in JSON, form and query requests`, async () => {
    for (const transport of ['json', 'form', 'query']) {
      for (const bhk of [undefined, 2, '3 BHK', '0']) {
        const saved: NormalizedLead[] = [];
        const handler = createHandler({ keys: async () => [key], log: () => {}, repository: { save: async lead => { saved.push(lead); return 'created'; } } });
        const payload = { ...contact, ...(bhk === undefined ? {} : { BHK: bhk }) };
        const query = new URLSearchParams(Object.entries(payload).map(([k, v]): [string, string] => [k, String(v)])).toString();
        const request: PushEvent = { rawPath: `/api/leads/create/${provider}`, httpMethod: 'POST', headers: { 'x-api-key': key, 'content-type': transport === 'form' ? 'application/x-www-form-urlencoded' : 'application/json' },
          body: transport === 'query' ? null : transport === 'form' ? query : JSON.stringify(payload), rawQueryString: transport === 'query' ? query : '' };
        assert.equal((await handler(request)).statusCode, 200);
        const bedrooms = bhk === undefined ? null : parseInt(String(bhk), 10);
        assert.equal(saved[0].bedrooms, bedrooms);
        assert.equal(saved[0].configuration, bedrooms === null ? null : bedrooms === 0 ? 'STUDIO' : `${bedrooms} BHK`);
      }
    }
  });
  test(`${provider} rejects invalid or conflicting BHK without saving`, async () => {
    let writes = 0;
    const handler = createHandler({ keys: async () => [key], log: () => {}, repository: { save: async () => { writes++; return 'created'; } } });
    for (const extra of [{ bhk: -1 }, { bhk: 'three' }, { bhk: '3.5' }, { bhk: '100' }, { bhk: '2', bedrooms: '3' }]) {
      const result = await handler({ rawPath: `/api/leads/create/${provider}`, httpMethod: 'POST', headers: { 'x-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify({ ...contact, ...extra }) });
      assert.equal(result.statusCode, 400);
    }
    assert.equal(writes, 0);
  });
}
