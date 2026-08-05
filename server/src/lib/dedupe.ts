import { CrmSource, MappedLead } from '../types/crm';

export type DedupeMatchKind = 'phone' | 'email' | 'source_property_name';

export interface MatchKey {
  kind: DedupeMatchKind;
  key: string;
}

/**
 * The 3 DB-matching rules in priority order (spec §5.1). Used both for
 * in-file dedupe (below) and for the DB duplicate lookups in the import
 * service — same rules, same priority, one implementation.
 */
export function buildMatchKeys(lead: MappedLead, source: CrmSource): MatchKey[] {
  const keys: MatchKey[] = [];
  if (lead.phone) keys.push({ kind: 'phone', key: `phone:${lead.phone}` });
  if (lead.email) keys.push({ kind: 'email', key: `email:${lead.email.toLowerCase()}` });
  if (lead.externalPropertyId && lead.nameNormalized) {
    keys.push({
      kind: 'source_property_name',
      key: `extid:${source}:${lead.externalPropertyId}:${lead.nameNormalized}`,
    });
  }
  return keys;
}

export interface InFileRow {
  rowNumber: number;
  lead: MappedLead;
}

export interface InFileDuplicate {
  rowNumber: number;
  keptRowNumber: number;
}

export interface InFileDedupeResult {
  /** Row numbers that should proceed to DB dedupe + insert. */
  keepRowNumbers: Set<number>;
  duplicates: InFileDuplicate[];
}

/**
 * De-dupes rows within a single file before anything touches the DB
 * (spec §5.3): rows sharing a phone, email, or (source, external_property_id,
 * normalized name) are grouped, the earliest lead_date wins, the rest are
 * reported as in-file duplicates.
 */
export function dedupeWithinFile(rows: InFileRow[], source: CrmSource): InFileDedupeResult {
  const n = rows.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  const firstSeenAt = new Map<string, number>();
  rows.forEach((row, idx) => {
    for (const { key } of buildMatchKeys(row.lead, source)) {
      const existing = firstSeenAt.get(key);
      if (existing !== undefined) union(idx, existing);
      else firstSeenAt.set(key, idx);
    }
  });

  const groups = new Map<number, number[]>();
  rows.forEach((_, idx) => {
    const root = find(idx);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(idx);
  });

  const keepRowNumbers = new Set<number>();
  const duplicates: InFileDuplicate[] = [];

  for (const members of groups.values()) {
    if (members.length === 1) {
      keepRowNumbers.add(rows[members[0]].rowNumber);
      continue;
    }
    let keepIdx = members[0];
    for (const idx of members) {
      const candidateDate = rows[idx].lead.leadDate;
      const currentKeepDate = rows[keepIdx].lead.leadDate;
      if (candidateDate && (!currentKeepDate || candidateDate.getTime() < currentKeepDate.getTime())) {
        keepIdx = idx;
      }
    }
    keepRowNumbers.add(rows[keepIdx].rowNumber);
    for (const idx of members) {
      if (idx === keepIdx) continue;
      duplicates.push({ rowNumber: rows[idx].rowNumber, keptRowNumber: rows[keepIdx].rowNumber });
    }
  }

  return { keepRowNumbers, duplicates };
}
