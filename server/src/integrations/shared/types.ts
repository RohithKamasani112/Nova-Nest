export interface PushEvent {
  version?: string;
  rawPath?: string;
  path?: string;
  rawQueryString?: string;
  httpMethod?: string;
  headers?: Record<string, string | undefined>;
  queryStringParameters?: Record<string, string | undefined> | null;
  multiValueQueryStringParameters?: Record<string, string[]> | null;
  body?: string | null;
  isBase64Encoded?: boolean;
  requestContext?: { requestId?: string; http?: { method?: string; path?: string } };
}
export interface NormalizedLead {
  source: 'magicbricks' | 'housing' | '99acres';
  name: string;
  mobile: string;
  country_code: string;
  email: string | null;
  project: string;
  city: string | null;
  message: string | null;
  raw_isd: string | null;
  lead_dt: string;
  received_at: string;
  raw_payload: Record<string, string>;
  price_raw?: string | null;
  price_value?: number | null;
  bedrooms?: number | null;
  configuration?: string | null;
}
export interface LeadRepository {
  save(lead: NormalizedLead): Promise<'created' | 'duplicate'>;
}
export class InputError extends Error {}
