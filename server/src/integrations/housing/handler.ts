import { secretKeyProvider } from '../shared/auth';
import { createLeadHandler, LeadHandlerDependencies } from '../shared/createLeadHandler';
import { createPostgresRepository } from '../shared/repository';
import { mapHousingPayload } from './mapper';
export function createHandler(deps: LeadHandlerDependencies) {
  return createLeadHandler(deps, { provider: 'housing', routes: ['/api/leads/create/housing'], map: mapHousingPayload });
}
export const handler = createHandler({
  keys: secretKeyProvider('HOUSING_API_KEY_SECRET_ARN'),
  repository: { save: async lead => {
    const { withTransaction } = await import('../../db/pool');
    return createPostgresRepository(withTransaction, process.env.HOUSING_DEDUPE_RULE).save(lead);
  } },
});
