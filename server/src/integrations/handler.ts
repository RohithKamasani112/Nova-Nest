import { handler as magicbricksHandler } from './magicbricks/handler';
import { handler as housingHandler } from './housing/handler';
import { handler as acres99Handler } from './acres99/handler';
import { PushEvent } from './shared/types';
export function handler(event: PushEvent, context?: { awsRequestId?: string }) {
  const route = event.rawPath ?? event.path ?? event.requestContext?.http?.path;
  if (route === '/api/leads/create/99acres') return acres99Handler(event, context);
  return route === '/api/leads/create/housing' ? housingHandler(event, context) : magicbricksHandler(event, context);
}
export { createHandler } from './magicbricks/handler';
