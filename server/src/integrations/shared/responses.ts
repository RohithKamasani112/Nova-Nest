export const MESSAGES = {
  created: 'Success: Lead punched in the CRM',
  duplicate: 'Failure: Lead already exist',
  unauthorized: 'Failure: Unauthorized',
  internal: 'Failure: Internal error',
} as const;
export function response(statusCode: number, body: string) {
  return { statusCode, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, body };
}
