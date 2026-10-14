import { getActiveKeys } from './auth';
import { createLeadHandler, LeadHandlerDependencies } from '../shared/createLeadHandler';
import { createPostgresRepository } from '../shared/repository';
export function createHandler(deps: LeadHandlerDependencies) {
  return createLeadHandler(deps, { provider: 'magicbricks', routes: ['/api/leads/create', '/api/leads/create/magicbricks'] });
}
export const handler = createHandler({
  keys: getActiveKeys,
  repository: { save: async lead => {
    const { withTransaction } = await import('../../db/pool');
    return createPostgresRepository(withTransaction, process.env.MAGICBRICKS_DEDUPE_RULE).save(lead);
  } },
});
