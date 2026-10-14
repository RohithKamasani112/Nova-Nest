import { AsyncLocalStorage } from 'node:async_hooks';

export interface CrmIdentity {
  id: string;
  email: string;
  role: string;
  source_scope: string[];
  agent_id: string | null;
  session_version: number;
}

export const crmIdentity = new AsyncLocalStorage<CrmIdentity>();
export const PORTAL_SOURCES: Record<string, string[]> = {
  magicbricks: ['magicbricks'],
  housing: ['housing', 'website', 'personal'],
  '99acres': ['99acres'],
};

// Always combine this with user-selected filters; filters cannot widen access.
export function accessSql(values: unknown[], alias = ''): string {
  const user = crmIdentity.getStore();
  if (!user || user.role === 'admin') return 'TRUE';
  const prefix = alias ? `${alias}.` : '';
  if (user.role === 'agent' && user.agent_id) {
    values.push(user.agent_id);
    return `${prefix}agent_id = $${values.length}`;
  }
  if (user.role === 'telecaller' && user.source_scope.length) {
    values.push(user.source_scope);
    return `${prefix}source::text = ANY($${values.length}::text[])`;
  }
  return 'FALSE';
}

export function visibleSources(): string[] {
  const user = crmIdentity.getStore();
  return user?.role === 'telecaller' ? user.source_scope : ['magicbricks', 'housing', '99acres', 'website', 'personal'];
}

export function teamAccessSql(values: unknown[], alias = 'a'): string {
  const user = crmIdentity.getStore();
  if (user?.role !== 'agent') return 'TRUE';
  if (!user.agent_id) return 'FALSE';
  values.push(user.agent_id);
  return `${alias}.id = $${values.length}`;
}

export function enquiryAccessSql(values: unknown[], alias = 'ld'): string {
  const user = crmIdentity.getStore();
  if (user?.role !== 'telecaller') return 'TRUE';
  values.push(user.source_scope);
  return `${alias}.incoming_source::text = ANY($${values.length}::text[])`;
}
