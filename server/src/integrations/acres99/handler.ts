import { secretKeyProvider } from '../shared/auth';
import { createLeadHandler, LeadHandlerDependencies } from '../shared/createLeadHandler';
import { createPostgresRepository } from '../shared/repository';
import { map99acresPayload } from './mapper';

export function createHandler(deps: LeadHandlerDependencies) {
  return createLeadHandler(deps, { provider: '99acres', routes: ['/api/leads/create/99acres'], map: map99acresPayload });
}
export const handler = createHandler({
  keys: secretKeyProvider('ACRES99_API_KEY_SECRET_ARN'),
  repository: { save: async lead => {
    const { withTransaction } = await import('../../db/pool');
    return createPostgresRepository(withTransaction, process.env.ACRES99_DEDUPE_RULE).save(lead);
  } },
});
