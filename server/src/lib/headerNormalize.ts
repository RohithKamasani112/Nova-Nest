/**
 * Header normalization + alias resolution (spec §3).
 *
 * Two normalized forms are kept:
 *  - display form: lowercased, punctuation-stripped, single-spaced — stored in
 *    source_column_registry for human readability.
 *  - key form: the display form with whitespace removed entirely — used as
 *    the actual comparison key so "Lead Phone Number", "lead_phone_number",
 *    and "Lead Phone No." all collapse onto the same token regardless of
 *    whether the source used spaces, underscores, or nothing.
 */

const STRIP_CHARS = /[._\-/#()]/g;

export function normalizeHeaderDisplay(raw: string): string {
  let s = raw.toLowerCase().trim();
  s = s.replace(/\s+/g, ' ');
  s = s.replace(STRIP_CHARS, '');
  return s.trim();
}

export function normalizeHeaderKey(raw: string): string {
  return normalizeHeaderDisplay(raw).replace(/\s+/g, '');
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j - 1] + 1,  // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

export type MatchMethod = 'exact' | 'substring' | 'fuzzy';

export interface HeaderMatch {
  canonicalField: string;
  method: MatchMethod;
  matchedAlias: string;
  distance?: number;
}

/**
 * canonicalField -> alias keys (already run through normalizeHeaderKey) is
 * expected to be precomputed by buildAliasIndex() and passed in as `index`.
 */
export interface AliasIndex {
  /** exact key -> canonicalField */
  exact: Map<string, string>;
  /** canonicalField -> alias keys, for substring/fuzzy scanning */
  byField: Map<string, string[]>;
}

export function buildAliasIndex(sourceMap: Record<string, string[]>): AliasIndex {
  const exact = new Map<string, string>();
  const byField = new Map<string, string[]>();
  for (const [canonicalField, aliases] of Object.entries(sourceMap)) {
    const keys = aliases.map(normalizeHeaderKey);
    byField.set(canonicalField, keys);
    for (const key of keys) {
      // First alias registered for a key wins; aliases should be unique per
      // source in practice.
      if (!exact.has(key)) exact.set(key, canonicalField);
    }
  }
  return { exact, byField };
}

const FUZZY_MAX_DISTANCE = 2;
const MIN_KEY_LENGTH_FOR_FUZZY = 4; // avoid nonsense matches on very short headers

/**
 * Resolution is "claim once": a canonical field already matched (by an
 * earlier, more confident tier or an earlier header) is excluded from
 * later substring/fuzzy attempts. Without this, a header like "Email
 * Vefification Status" would substring-match the "email" alias and
 * silently steal/overwrite the real "Email" column's value — exact matches
 * must win outright over looser ones, never get clobbered by them.
 */
export function exactMatch(key: string, index: AliasIndex): HeaderMatch | null {
  const field = index.exact.get(key);
  return field ? { canonicalField: field, method: 'exact', matchedAlias: key } : null;
}

export function substringMatch(key: string, index: AliasIndex, excludeFields: ReadonlySet<string>): HeaderMatch | null {
  if (!key) return null;
  for (const [canonicalField, aliasKeys] of index.byField) {
    if (excludeFields.has(canonicalField)) continue;
    for (const aliasKey of aliasKeys) {
      if (aliasKey.length < MIN_KEY_LENGTH_FOR_FUZZY) continue;
      if (key.includes(aliasKey) || aliasKey.includes(key)) {
        return { canonicalField, method: 'substring', matchedAlias: aliasKey };
      }
    }
  }
  return null;
}

export function fuzzyMatch(key: string, index: AliasIndex, excludeFields: ReadonlySet<string>): HeaderMatch | null {
  if (!key) return null;
  let best: HeaderMatch | null = null;
  for (const [canonicalField, aliasKeys] of index.byField) {
    if (excludeFields.has(canonicalField)) continue;
    for (const aliasKey of aliasKeys) {
      if (aliasKey.length < MIN_KEY_LENGTH_FOR_FUZZY) continue;
      const distance = levenshtein(key, aliasKey);
      if (distance <= FUZZY_MAX_DISTANCE && (!best || distance < (best.distance ?? Infinity))) {
        best = { canonicalField, method: 'fuzzy', matchedAlias: aliasKey, distance };
      }
    }
  }
  return best;
}
