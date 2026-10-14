import { handler as magicbricksHandler } from './magicbricks/handler';
import { handler as housingHandler } from './housing/handler';
import { PushEvent } from './shared/types';
export function handler(event: PushEvent, context?: { awsRequestId?: string }) {
  const route = event.rawPath ?? event.path ?? event.requestContext?.http?.path;
  return route === '/api/leads/create/housing' ? housingHandler(event, context) : magicbricksHandler(event, context);
}
export { createHandler } from './magicbricks/handler';
