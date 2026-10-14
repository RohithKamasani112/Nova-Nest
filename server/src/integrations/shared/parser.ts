import { InputError, PushEvent } from './types';

export const MAX_BYTES = 10 * 1024;
export function parsePayload(event: PushEvent, preferQueryCredential = false): Record<string, string> {
  const query = event.rawQueryString ?? new URLSearchParams(event.queryStringParameters as Record<string, string> ?? {}).toString();
  const body = event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64').toString('utf8') : event.body ?? '';
  if (Buffer.byteLength(query) + Buffer.byteLength(body) > MAX_BYTES) throw new InputError('Payload too large');
  const result: Record<string, string> = Object.create(null);
  const add = (key: string, value: unknown) => {
    const normalized = key.toLowerCase().trim();
    if (normalized in result) {
      if (preferQueryCredential && normalized === 'api_key') return;
      throw new InputError('Repeated field');
    }
    if (typeof value !== 'string' && typeof value !== 'number' && value !== null) throw new InputError('Invalid field value');
    result[normalized] = value === null ? '' : String(value).trim();
  };
  // URLSearchParams decodes exactly once (including + as spaces). Do not decode
  // again: a literal % or %26 in a message must not become a different payload.
  for (const [key, value] of new URLSearchParams(query)) add(key, value);
  if (event.multiValueQueryStringParameters && !event.rawQueryString) {
    if (Object.values(event.multiValueQueryStringParameters).some(values => values.length > 1)) throw new InputError('Repeated field');
  }
  if (body) {
    const contentType = Object.entries(event.headers ?? {}).find(([key]) => key.toLowerCase() === 'content-type')?.[1]?.split(';')[0].trim().toLowerCase();
    if (contentType === 'application/json' || (!contentType && body.trim().startsWith('{'))) {
      let parsed: unknown;
      try { parsed = JSON.parse(body); } catch { throw new InputError('Invalid JSON'); }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new InputError('Invalid JSON object');
      for (const [key, value] of Object.entries(parsed)) add(key, value);
    } else if (contentType === 'application/x-www-form-urlencoded' || !contentType) {
      for (const [key, value] of new URLSearchParams(body)) add(key, value);
    } else throw new InputError('Unsupported content type');
  }
  return result;
}

export function suppliedKey(event: PushEvent, payload: Record<string, string>, preferHeader = false): string | undefined {
  const headers = Object.entries(event.headers ?? {}).filter(([key]) => key.toLowerCase() === 'x-api-key');
  if (headers.length > 1) throw new InputError('Repeated API key');
  const header = headers[0]?.[1]?.trim();
  if (!preferHeader && header && payload.api_key && header !== payload.api_key) return undefined;
  return header || payload.api_key;
}
