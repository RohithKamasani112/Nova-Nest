// Local endpoint using the real parser/auth/validator with an in-memory repository.
// Nothing is sent to AWS or the CRM database. For database tests use test:magicbricks:db.
import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createHandler } = require('../dist/integrations/magicbricks/handler.js');
const { dedupeKey } = require('../dist/integrations/magicbricks/repository.js');
const key = process.env.MAGICBRICKS_TEST_KEY || randomBytes(32).toString('hex');
const saved = new Set();
const handler = createHandler({ keys: async () => [key], repository: { save: async lead => { const id = dedupeKey(lead); if (saved.has(id)) return 'duplicate'; saved.add(id); return 'created'; } } });
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 10240) { res.writeHead(400); res.end('Failure: Payload too large'); return; } chunks.push(chunk); }
  const result = await handler({ rawPath: url.pathname, rawQueryString: url.search.slice(1), httpMethod: req.method, headers: req.headers, body: Buffer.concat(chunks).toString('utf8') });
  res.writeHead(result.statusCode, result.headers); res.end(result.body);
});
server.listen(4010, '127.0.0.1', () => console.log('Local-only endpoint http://127.0.0.1:4010/api/leads/create. Set MAGICBRICKS_TEST_KEY to use your own local test key; no keys are printed.'));
