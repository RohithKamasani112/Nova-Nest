import { randomUUID } from 'node:crypto';
import { matchesKey } from './auth';
import { parsePayload, suppliedKey } from './parser';
import { MESSAGES, response } from './responses';
import { redactedRequest } from './requestLog';
import { InputError, LeadRepository, NormalizedLead, PushEvent } from './types';
import { validateLead } from './validator';

export interface LeadHandlerDependencies {
  keys: () => Promise<string[]>;
  repository: LeadRepository;
  now?: () => Date;
  log?: (entry: Record<string, unknown>) => void;
}
interface ProviderOptions {
  provider: NormalizedLead['source'];
  routes: string[];
  map?: (payload: Record<string, string>) => Record<string, string>;
}
export function createLeadHandler(deps: LeadHandlerDependencies, options: ProviderOptions) {
  const housing = options.provider === 'housing';
  return async (event: PushEvent, context?: { awsRequestId?: string }) => {
    const requestId = context?.awsRequestId ?? randomUUID();
    const log = deps.log ?? (entry => console.log(JSON.stringify(entry)));
    let maskedMobile: string | undefined;
    const finish = (statusCode: number, message: string, outcome: string) => {
      log({ requestId, provider: options.provider, outcome, status: statusCode, ...(maskedMobile ? { mobile: maskedMobile } : {}) });
      if (!housing) return response(statusCode, message);
      const result = response(statusCode, JSON.stringify({ status: outcome === 'created' ? 'success' : 'failure', message: message.replace(/^(Success|Failure): /, '') }));
      result.headers['Content-Type'] = 'application/json; charset=utf-8';
      return result;
    };
    try {
      const method = event.requestContext?.http?.method ?? event.httpMethod;
      const route = event.rawPath ?? event.path ?? event.requestContext?.http?.path;
      if (housing) log({ requestId, provider: 'housing', outcome: 'incoming_request', method, route, ...redactedRequest(event) });
      if (!(housing ? ['POST'] : ['GET', 'POST']).includes(method ?? '') || !options.routes.includes(route ?? '')) return finish(404, 'Failure: Not found', 'not_found');
      const payload = parsePayload(event, housing);
      const key = suppliedKey(event, payload, housing);
      if (!key || !matchesKey(key, await deps.keys())) return finish(401, MESSAGES.unauthorized, 'unauthorized');
      const lead = validateLead(options.map ? options.map(payload) : payload, deps.now?.() ?? new Date(), options.provider);
      maskedMobile = '******' + lead.mobile.slice(-4);
      const result = await deps.repository.save(lead);
      return finish(200, MESSAGES[result], result);
    } catch (error) {
      if (error instanceof InputError) return finish(400, 'Failure: ' + error.message, 'invalid');
      return finish(500, MESSAGES.internal, 'error');
    }
  };
}
