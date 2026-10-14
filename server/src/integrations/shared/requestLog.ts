import { MAX_BYTES } from './parser';
import { PushEvent } from './types';
const SENSITIVE = /api[-_]?key|authorization|cookie|token|secret|password/i;

export function redactedRequest(event: PushEvent) {
  const values = new Set<string>();
  function redact(value: unknown, key = ''): unknown {
    if (SENSITIVE.test(key)) {
      if (typeof value === 'string' && value) values.add(value);
      return '[REDACTED]';
    }
    if (Array.isArray(value)) return value.map(item => redact(item));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, redact(item, name)]));
    return value;
  }
  const body = event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64').toString('utf8') : event.body ?? '';
  let parsed: unknown;
  if (Buffer.byteLength(body) > MAX_BYTES) parsed = { omitted: 'oversized body', bytes: Buffer.byteLength(body) };
  else if (!body.trim()) parsed = null;
  else {
    try { parsed = JSON.parse(body); }
    catch {
      const contentType = Object.entries(event.headers ?? {}).find(([key]) => key.toLowerCase() === 'content-type')?.[1] ?? '';
      parsed = contentType.toLowerCase().includes('application/x-www-form-urlencoded')
        ? [...new URLSearchParams(body)].map(([key, value]) => ({ [key]: value }))
        : { omitted: 'unparseable body', bytes: Buffer.byteLength(body) };
    }
  }
  const query = event.rawQueryString !== undefined ? [...new URLSearchParams(event.rawQueryString)].map(([key, value]) => ({ [key]: value })) : event.multiValueQueryStringParameters ?? event.queryStringParameters;
  const safe = redact({ headers: event.headers ?? {}, query: query ?? {}, body: parsed });
  let serialized = JSON.stringify(safe);
  for (const secret of [...values].sort((a, b) => b.length - a.length)) serialized = serialized.split(JSON.stringify(secret).slice(1, -1)).join('[REDACTED]');
  return JSON.parse(serialized) as Record<string, unknown>;
}
