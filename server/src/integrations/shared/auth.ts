import { createHash, timingSafeEqual } from 'node:crypto';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

export function matchesKey(supplied: string | undefined, activeKeys: string[]): boolean {
  const digest = (value: string) => createHash('sha256').update(value).digest();
  const candidate = digest(supplied ?? '');
  let matched = 0;
  for (const key of activeKeys) matched |= Number(timingSafeEqual(candidate, digest(key)));
  return !!supplied && matched !== 0;
}
export function createKeyProvider(fetchSecret: () => Promise<string>, ttlMs = 60000) {
  let cached: { keys: string[]; expires: number } | undefined;
  let pending: Promise<string[]> | undefined;
  return async () => {
    if (cached && cached.expires > Date.now()) return cached.keys;
    if (!pending) pending = (async () => {
      const parsed: unknown = JSON.parse(await fetchSecret());
      const record = parsed as { active?: unknown; keys?: unknown };
      const keys = record && typeof record === 'object' ? [record.active, ...(Array.isArray(record.keys) ? record.keys : [])].filter((key): key is string => typeof key === 'string' && key.length >= 32) : [];
      if (!keys.length) throw new Error('Invalid integration secret');
      cached = { keys, expires: Date.now() + ttlMs };
      return keys;
    })().finally(() => { pending = undefined; });
    return pending;
  };
}
const client = new SecretsManagerClient({ maxAttempts: 2 });
export function secretKeyProvider(environmentName: string) {
  return createKeyProvider(async () => {
    const secretId = process.env[environmentName];
    if (!secretId) throw new Error('Integration secret not configured');
    const result = await client.send(new GetSecretValueCommand({ SecretId: secretId }), { abortSignal: AbortSignal.timeout(2000) });
    if (!result.SecretString) throw new Error('Integration secret unavailable');
    return result.SecretString;
  });
}
