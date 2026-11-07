export function readPreference<T>(key: string, fallback: T): T {
  try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value === null ? fallback : value; } catch { return fallback; }
}
export function savePreference(key: string, value: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
