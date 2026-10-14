import { crmApi } from '../services/crmApi';
import { config } from './config';

const apiBase = () => {
  const base = crmApi.defaults.baseURL;
  if (!base) throw new Error('The CRM API URL is not configured.');
  return base.replace(/\/$/, '');
};
const isAdmin = () => {
  try { return JSON.parse(localStorage.getItem('estate_auth_user') ?? 'null')?.role === 'admin'; }
  catch { return false; }
};

// This is a public redirect through Lambda for listing media only. The backend
// validates the bucket, configured prefix and assets/ scope before signing.
export const publicAssetUrl = (path: string): string => `${apiBase()}/public/storage/asset?${new URLSearchParams({ path })}`;
const listingMediaUrl = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  if (value.startsWith('assets/') || (config.aws.s3.folderName && value.startsWith(`${config.aws.s3.folderName}/assets/`))) return publicAssetUrl(value);
  // Lambda canonicalizes owned S3 images to assets/...; external URLs stay
  // unchanged and are never signed with this site's execution role.
  return value;
};
const listingMedia = (input: unknown): unknown => {
  if (!Array.isArray(input)) return input;
  return input.map(row => ({ ...row,
    images: Array.isArray(row.images) ? row.images.map(listingMediaUrl) : [],
    videos: Array.isArray(row.videos) ? row.videos.map(listingMediaUrl) : [],
    ...(row.brochure ? { brochure: listingMediaUrl(row.brochure) } : {}),
  }));
};
const isPropertyCollection = (path: string) => path === 'properties.json' || path === `${config.aws.s3.folderName}/properties.json`;

export const uploadToS3 = async (file: Blob, path: string): Promise<string> => {
  const extension = path.split('.').pop()?.toLowerCase();
  const fallbackTypes: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif', heic: 'image/heic', mp4: 'video/mp4', webm: 'video/webm' };
  const contentType = file.type || fallbackTypes[extension ?? ''] || 'application/octet-stream';
  const { data } = await crmApi.post<{ url: string; fields: Record<string, string>; path: string }>('/storage/upload', { path, contentType, size: file.size });
  const form = new FormData();
  Object.entries(data.fields).forEach(([key, value]) => form.append(key, value));
  form.append('file', file);
  // No AWS SDK, AWS secret, or CRM bearer token is sent to S3. The short-lived
  // POST policy is restricted by Lambda to one exact key, MIME and byte count.
  const response = await fetch(data.url, { method: 'POST', body: form });
  if (!response.ok) throw new Error(`Upload failed (${response.status}).`);
  return data.path.startsWith('assets/') ? publicAssetUrl(data.path) : data.path;
};

export const getFromS3 = async (path: string): Promise<string> => {
  if (isPropertyCollection(path) && !isAdmin()) {
    const { data } = await crmApi.get('/public/storage/properties');
    return JSON.stringify(listingMedia(data));
  }
  const { data } = await crmApi.get<{ content: string }>('/storage/object', { params: { path } });
  return isPropertyCollection(path) ? JSON.stringify(listingMedia(JSON.parse(data.content))) : data.content;
};

export const getSignedS3Url = async (path: string, _expiresIn = 300): Promise<string> => {
  const { data } = await crmApi.post<{ url: string }>('/storage/download', { path });
  return data.url;
};

export const deleteFromS3 = async (path: string): Promise<void> => {
  // Uploaded listing URLs are stable Lambda redirects; send their logical key.
  try {
    const url = new URL(path);
    if (url.origin === new URL(apiBase()).origin && url.pathname.endsWith('/public/storage/asset')) path = url.searchParams.get('path') ?? path;
  } catch { /* Relative object key. */ }
  await crmApi.delete('/storage/object', { params: { path } });
};

export const listS3Files = async (prefix: string): Promise<string[]> => {
  const { data } = await crmApi.get<{ keys: string[] }>('/storage/list', { params: { prefix } });
  return data.keys;
};

export const uploadJsonToS3 = async (data: unknown, path: string): Promise<void> => {
  await crmApi.put('/storage/object', { path, content: JSON.stringify(data), contentType: 'application/json' });
};

export const uploadTextToS3 = async (content: string, path: string, contentType = 'text/plain'): Promise<string> => {
  await crmApi.put('/storage/object', { path, content, contentType });
  return path;
};

export const getJsonFromS3 = async <T>(path: string): Promise<T> => {
  try { return JSON.parse(await getFromS3(path)) as T; }
  catch (error: any) {
    // Only an explicitly missing collection is initially empty. Auth/network
    // failures must never become [] and overwrite existing saved records.
    if (error?.response?.status === 404 && ['properties.json', 'leads.json', 'invoices/bills.json', 'invoices/documents.json'].includes(path)) return [] as T;
    throw error;
  }
};
