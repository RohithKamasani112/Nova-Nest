import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../env';

export class StorageError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export interface StorageSettings { bucket: string; folder: string; region: string; }
const JSON_FILES = new Set(['invoices/counters.json', 'properties.json', 'leads.json', 'invoices/documents.json', 'invoices/bills.json']);
const PUBLIC_FIELDS = new Set(('id title price location locality description images videos brochure category status bedrooms bathrooms areaSqft amenities featured verified urgent createdAt updatedAt carpetArea builtUpArea yearBuilt parking floors furnished latitude longitude videoUrl isDummy isActive pricePerSqft agentPhone nearbyPlaces maintenanceCharges securityDeposit facingDirection floorNumber availableFrom possessionStatus tenantPreference furnishingStatus').split(' '));
const MIME_BY_EXTENSION: Record<string, string[]> = {
  jpg: ['image/jpeg'], jpeg: ['image/jpeg'], png: ['image/png'], webp: ['image/webp'], gif: ['image/gif'],
  avif: ['image/avif'], heic: ['image/heic'], pdf: ['application/pdf'], mp4: ['video/mp4'], webm: ['video/webm'],
};

export function storageSettings(): StorageSettings {
  const folder = env.s3Folder.replace(/^\/+|\/+$/g, '');
  if (!folder || /[\\\x00-\x1f]/.test(folder) || folder.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new StorageError(503, 'Storage folder is not configured.');
  }
  return { bucket: env.s3BucketName, folder, region: env.s3Region };
}

// S3 keys are selected on the server. A browser cannot choose another bucket,
// another site's folder, CRM staging files, or a path outside the allowlist.
export function normalizeStoragePath(input: string, settings: StorageSettings): string {
  let value = input;
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    const allowed = new Set([`${settings.bucket}.s3.${settings.region}.amazonaws.com`, `${settings.bucket}.s3.amazonaws.com`]);
    if (url.protocol !== 'https:' || !allowed.has(url.hostname) || url.username || url.password || url.port) {
      throw new StorageError(400, 'Invalid storage URL.');
    }
    value = decodeURIComponent(url.pathname.slice(1));
    if (!value.startsWith(settings.folder + '/')) throw new StorageError(400, 'Storage path is outside the configured folder.');
  }
  if (value.startsWith(settings.folder + '/')) value = value.slice(settings.folder.length + 1);
  if (!value || value.length > 900 || /[\\\x00-\x1f?#%]/.test(value) || value.startsWith('/') || value.split('/').some(part => part === '.' || part === '..' || !part)) {
    throw new StorageError(400, 'Invalid storage path.');
  }
  const allowed = JSON_FILES.has(value) || value === 'sitemap.xml' ||
    /^assets\/[a-zA-Z0-9_./ -]+$/.test(value) ||
    /^invoices\/[a-zA-Z0-9_.-]+\.pdf$/i.test(value) ||
    /^property-shares\/[a-zA-Z0-9_.-]+\.json$/.test(value);
  if (!allowed) throw new StorageError(400, 'Storage path is not allowed.');
  return value;
}

export function publicProperties(input: unknown): Record<string, unknown>[] {
  if (!Array.isArray(input)) throw new StorageError(502, 'Listing data is invalid.');
  return input.filter(row => row && typeof row === 'object' && row.isActive !== false && !row.archivedAt)
    .map(row => Object.fromEntries(Object.entries(row).filter(([key]) => PUBLIC_FIELDS.has(key))));
}

// Store portable logical keys for this site's media. Existing public external
// images remain external; the Lambda never signs a different site's/bucket's key.
export function canonicalPropertyMedia(input: unknown, settings: StorageSettings): unknown {
  if (!Array.isArray(input)) throw new StorageError(400, 'Expected a listing collection.');
  const media = (value: unknown) => {
    if (typeof value !== 'string') return value;
    let candidate = value;
    try {
      const url = new URL(value);
      if (url.pathname.endsWith('/public/storage/asset')) candidate = url.searchParams.get('path') ?? value;
    } catch { /* Relative key. */ }
    try {
      const relative = normalizeStoragePath(candidate, settings);
      return relative.startsWith('assets/') ? relative : value;
    } catch { return value; }
  };
  return input.map(row => !row || typeof row !== 'object' ? row : ({ ...row,
    ...(Array.isArray(row.images) ? { images: row.images.map(media) } : {}),
    ...(Array.isArray(row.videos) ? { videos: row.videos.map(media) } : {}),
    ...(row.brochure ? { brochure: media(row.brochure) } : {}),
  }));
}

export function validateUpload(path: string, contentType: string, size: number) {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  if (!path.startsWith('assets/') && !/^invoices\/[^/]+\.pdf$/i.test(path)) throw new StorageError(400, 'Only media and PDF files may be uploaded.');
  if (!MIME_BY_EXTENSION[extension]?.includes(contentType)) throw new StorageError(400, 'Unsupported file type or extension.');
  const max = contentType.startsWith('video/') ? 50 * 1024 * 1024 : contentType === 'application/pdf' ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
  if (!Number.isSafeInteger(size) || size < 1 || size > max) throw new StorageError(400, 'File size is outside the allowed limit.');
}

export function createStorageService(client: S3Client, getSettings = storageSettings) {
  const key = (path: string) => {
    const settings = getSettings();
    const relative = normalizeStoragePath(path, settings);
    return { ...settings, relative, Key: `${settings.folder}/${relative}` };
  };
  const readVersion = async (path: string): Promise<{ content: string; revision: string | null }> => {
    const { bucket, Key } = key(path);
    try {
      const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key }));
      if ((result.ContentLength ?? 0) > 1_500_000) throw new StorageError(413, 'Stored document is too large.');
      const content = await result.Body?.transformToString();
      if (!content || Buffer.byteLength(content) > 1_500_000) throw new StorageError(502, 'Stored document is invalid.');
      return { content, revision: result.ETag ?? null };
    } catch (error) {
      if ((error as { name?: string }).name === 'NoSuchKey') return { content: '[]', revision: null };
      throw error;
    }
  };
  const compareAndWrite = async (path: string, content: string, revision: string | null) => {
    const { bucket, Key } = key(path);
    if (Buffer.byteLength(content) > 1_500_000) throw new StorageError(413, 'Stored document is too large.');
    try {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key, Body: content, ContentType: 'application/json',
        ServerSideEncryption: 'AES256', CacheControl: 'no-store',
        ...(revision ? { IfMatch: revision } : { IfNoneMatch: '*' }) }));
    } catch (error) {
      const e = error as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (['PreconditionFailed', 'ConditionalRequestConflict'].includes(e.name ?? '') || [409, 412].includes(e.$metadata?.httpStatusCode ?? 0)) {
        throw new StorageError(409, 'This record changed in another session. Refresh and review before saving.');
      }
      throw error;
    }
  };
  return {
    readVersion,
    compareAndWrite,
    async mutateProperty(operation: string, id: string, input: Record<string, any>, expectedUpdatedAt: string | null, actor: string) {
      for (let attempt = 0; attempt < 4; attempt++) {
        const snapshot = await readVersion('properties.json');
        const properties = JSON.parse(snapshot.content) as Record<string, any>[];
        if (!Array.isArray(properties)) throw new StorageError(502, 'Listing data is invalid.');
        const index = properties.findIndex(p => p.id === id);
        const old = properties[index];
        if (operation !== 'create' && !old) throw new StorageError(404, 'Property not found.');
        if (operation === 'create' && old) throw new StorageError(409, 'Property already exists.');
        if (old && expectedUpdatedAt !== (old.updatedAt || old.createdAt || null)) throw new StorageError(409, 'This property was changed by another user. Refresh before saving.');
        const now = new Date(Math.max(Date.now(), (Date.parse(old?.updatedAt || old?.createdAt || '') || 0) + 1)).toISOString();
        const { id: _id, createdAt: _created, updatedAt: _updated, history: _history, archivedAt: _archived, ...safe } = input;
        let updated: Record<string, any> = { ...old, ...safe, id, createdAt: old?.createdAt || now, updatedAt: now };
        if (operation === 'archive') updated = { ...old, isActive: false, archivedAt: now, updatedAt: now };
        if (operation === 'restore') updated = { ...old, archivedAt: undefined, isActive: false, updatedAt: now };
        if (operation === 'delete' && !old.archivedAt) throw new StorageError(400, 'Archive this property before permanently deleting it.');
        if (operation === 'create' || operation === 'update') {
          if (old?.archivedAt) throw new StorageError(400, 'Restore this property before editing it.');
          if (updated.locality) updated.locality = String(updated.locality).trim().replace(/\s+/g, ' ');
          if (updated.isActive !== false) {
            for (const field of ['title', 'locality', 'location', 'description']) if (!String(updated[field] || '').trim()) throw new StorageError(400, `${field} is required to publish.`);
            if (!(updated.price > 0) || !(updated.areaSqft > 0) || !updated.images?.length) throw new StorageError(400, 'A positive price, size and at least one image are required to publish.');
          }
        }
        const fields = ['title', 'price', 'status', 'isActive', 'agentPhone', 'locality', 'archivedAt'];
        updated.history = [...(old?.history || []), { at: now, actor, operation,
          changes: Object.fromEntries(fields.filter(field => old?.[field] !== updated[field]).map(field => [field, { before: old?.[field] ?? null, after: updated[field] ?? null }])) }].slice(-100);
        if (operation === 'delete') properties.splice(index, 1);
        else if (index < 0) properties.push(updated);
        else properties[index] = updated;
        try {
          await compareAndWrite('properties.json', JSON.stringify(canonicalPropertyMedia(properties, key('properties.json'))), snapshot.revision);
          return updated;
        } catch (error) { if (!(error instanceof StorageError && error.status === 409) || attempt === 3) throw error; }
      }
      throw new StorageError(409, 'Inventory is busy. Please retry.');
    },
    async appendBillingDocument(document: Record<string, any>) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const snapshot = await readVersion('invoices/documents.json');
        const documents = JSON.parse(snapshot.content) as Record<string, any>[];
        if (!Array.isArray(documents)) throw new StorageError(502, 'Billing history is invalid.');
        if (documents.some(doc => doc.docNumber === document.docNumber)) throw new StorageError(409, 'This document number already exists. Generate a new document.');
        const saved = { ...document, id: document.docNumber, createdAt: new Date().toISOString() };
        try { await compareAndWrite('invoices/documents.json', JSON.stringify([...documents, saved]), snapshot.revision); return saved; }
        catch (error) { if (!(error instanceof StorageError && error.status === 409) || attempt === 4) throw error; }
      }
      throw new StorageError(409, 'Billing history is busy. Please retry.');
    },
    async reserveDocumentNumber(type: string) {
      const prefixes: Record<string, string> = { sale_booking: 'SALE', commission: 'COMM', service: 'SERV', token_receipt: 'TOKEN' };
      if (!prefixes[type]) throw new StorageError(400, 'Unknown document type.');
      const year = new Date().getUTCFullYear();
      const prefix = type === 'token_receipt' ? 'NONN' : `NN-${prefixes[type]}-${year}-`;
      for (let attempt = 0; attempt < 8; attempt++) {
        const snapshot = await readVersion('invoices/counters.json');
        const counters = JSON.parse(snapshot.content);
        const state: Record<string, number> = Array.isArray(counters) ? {} : counters;
        const docs = JSON.parse((await readVersion('invoices/documents.json')).content) as Record<string, any>[];
        const highest = docs.reduce((max, doc) => typeof doc.docNumber === 'string' && doc.docNumber.startsWith(prefix) ? Math.max(max, Number(doc.docNumber.slice(prefix.length)) || 0) : max, type === 'token_receipt' ? 603 : 0);
        const next = Math.max(state[prefix] || 0, highest) + 1;
        state[prefix] = next;
        try { await compareAndWrite('invoices/counters.json', JSON.stringify(state), snapshot.revision); return prefix + String(next).padStart(type === 'token_receipt' ? 4 : 3, '0'); }
        catch (error) { if (!(error instanceof StorageError && error.status === 409) || attempt === 7) throw error; }
      }
      throw new StorageError(409, 'Document numbering is busy. Please retry.');
    },
    async read(path: string) {
      const resolved = key(path);
      const { bucket, Key, relative } = resolved;
      if (!JSON_FILES.has(relative) && relative !== 'sitemap.xml' && !relative.startsWith('property-shares/')) throw new StorageError(400, 'Use a download URL for media.');
      try {
        const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key }));
        if ((result.ContentLength ?? 0) > 1_500_000) throw new StorageError(413, 'Stored document is too large.');
        const content = await result.Body?.transformToString();
        if (content === undefined) throw new StorageError(404, 'Document not found.');
        if (Buffer.byteLength(content) > 1_500_000) throw new StorageError(413, 'Stored document is too large.');
        if (relative === 'properties.json') {
          try { return JSON.stringify(canonicalPropertyMedia(JSON.parse(content), resolved)); }
          catch { throw new StorageError(502, 'Listing data is invalid.'); }
        }
        return content;
      } catch (error) {
        if ((error as { name?: string }).name === 'NoSuchKey') throw new StorageError(404, 'Document not found.');
        throw error;
      }
    },
    async write(path: string, content: string, contentType: string) {
      const resolved = key(path);
      const { bucket, Key, relative } = resolved;
      if (Buffer.byteLength(content) > 1_500_000) throw new StorageError(413, 'Document is too large.');
      if (relative.endsWith('.json') && (JSON_FILES.has(relative) || relative.startsWith('property-shares/'))) {
        let parsed: unknown;
        try { parsed = JSON.parse(content); } catch { throw new StorageError(400, 'Invalid JSON document.'); }
        if (JSON_FILES.has(relative) && !Array.isArray(parsed)) throw new StorageError(400, 'Expected a document collection.');
        if (relative === 'properties.json') content = JSON.stringify(canonicalPropertyMedia(parsed, resolved));
        contentType = 'application/json';
      } else if (relative === 'sitemap.xml') contentType = 'application/xml';
      else throw new StorageError(400, 'Use the upload endpoint for media.');
      await client.send(new PutObjectCommand({ Bucket: bucket, Key, Body: content, ContentType: contentType,
        ServerSideEncryption: 'AES256', CacheControl: 'no-store' }));
    },
    async upload(path: string, contentType: string, size: number) {
      const { bucket, Key, relative } = key(path);
      validateUpload(relative, contentType, size);
      // Exact key, MIME and byte count are enforced by S3's signed POST policy.
      const signed = await createPresignedPost(client, { Bucket: bucket, Key, Expires: 300,
        Fields: { 'Content-Type': contentType, 'x-amz-server-side-encryption': 'AES256' },
        Conditions: [['content-length-range', size, size], ['eq', '$Content-Type', contentType], ['eq', '$x-amz-server-side-encryption', 'AES256']] });
      return { ...signed, path: relative, expiresIn: 300 };
    },
    async download(path: string, publicAsset = false) {
      const { bucket, Key, relative } = key(path);
      if (publicAsset && !relative.startsWith('assets/')) throw new StorageError(404, 'Asset not found.');
      if (!relative.startsWith('assets/') && !/^invoices\/[^/]+\.pdf$/i.test(relative)) throw new StorageError(400, 'Only media and PDF downloads are allowed.');
      const extension = relative.split('.').pop()?.toLowerCase() ?? '';
      const contentType = MIME_BY_EXTENSION[extension]?.[0];
      if (!contentType) throw new StorageError(400, 'Unsupported asset type.');
      return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key,
        ResponseContentType: contentType, ResponseContentDisposition: relative.startsWith('invoices/') ? `attachment; filename="${relative.split('/').pop()}"` : 'inline' }), { expiresIn: 300 });
    },
    async remove(path: string) {
      const { bucket, Key, relative } = key(path);
      if (!relative.startsWith('assets/') && !/^invoices\/[^/]+\.pdf$/i.test(relative)) throw new StorageError(400, 'Only media files can be deleted.');
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key }));
    },
    async list(prefix: string) {
      const settings = getSettings();
      const relative = prefix.startsWith(settings.folder + '/') ? prefix.slice(settings.folder.length + 1) : prefix;
      if (relative !== 'property-shares/') throw new StorageError(400, 'Listing this folder is not allowed.');
      const keys: string[] = [];
      let continuation: string | undefined;
      do {
        const result = await client.send(new ListObjectsV2Command({ Bucket: settings.bucket, Prefix: `${settings.folder}/${relative}`, ContinuationToken: continuation, MaxKeys: 1000 }));
        keys.push(...(result.Contents ?? []).flatMap(item => item.Key ? [item.Key] : []));
        continuation = result.IsTruncated ? result.NextContinuationToken : undefined;
      } while (continuation && keys.length < 5000);
      return keys;
    },
  };
}

// On Lambda, credentials come from the execution role, never from the browser.
export const storageService = createStorageService(new S3Client({ region: env.s3Region }));
export type StorageService = ReturnType<typeof createStorageService>;
