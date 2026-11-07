import { S3Client, GetObjectCommand, PutObjectCommand, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import { parseArgs } from 'node:util';
import 'dotenv/config';
const { values, positionals } = parseArgs({ allowPositionals: true, options: { bucket: { type: 'string' }, folder: { type: 'string' }, snapshot: { type: 'string' }, confirm: { type: 'boolean' } } });
const operation = positionals[0];
const bucket = values.bucket || process.env.S3_BUCKET_NAME;
const folder = (values.folder || process.env.S3_FOLDER || '').replace(/^\/+|\/+$/g, '');
if (!['snapshot', 'restore', 'check'].includes(operation) || !bucket || !folder || folder.split('/').some(p => !p || p === '..' || p === '.') || /[\\\x00-\x1f]/.test(folder)) throw new Error('Usage: node scripts/storage-backup.mjs check|snapshot|restore --bucket BUCKET --folder FOLDER [--snapshot TIMESTAMP --confirm]');
const client = new S3Client({ region: process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1' });
const files = ['properties.json', 'invoices/documents.json', 'invoices/counters.json', 'sitemap.xml'];
const timestamp = values.snapshot || new Date().toISOString().replace(/[:.]/g, '-');
if (!/^[0-9TZ-]+$/.test(timestamp)) throw new Error('Invalid snapshot timestamp.');
try {
  const versioning = await client.send(new GetBucketVersioningCommand({ Bucket: bucket }));
  if (operation === 'check') { console.log(`Bucket versioning: ${versioning.Status || 'not enabled'}. No changes made.`); }
  else {
    if (operation === 'restore' && (!values.confirm || !values.snapshot)) throw new Error('Restore requires --snapshot and --confirm. First pause admin writes and take a current snapshot.');
    for (const file of files) {
      const currentKey = `${folder}/${file}`;
      const backupKey = `${folder}/backups/${timestamp}/${file}`;
      try {
        const source = await client.send(new GetObjectCommand({ Bucket: bucket, Key: operation === 'snapshot' ? currentKey : backupKey }));
        const bytes = await source.Body.transformToByteArray();
        let revision;
        if (operation === 'restore') {
          try { revision = (await client.send(new GetObjectCommand({ Bucket: bucket, Key: currentKey }))).ETag; }
          catch (error) { if (error.name !== 'NoSuchKey') throw error; }
        }
        await client.send(new PutObjectCommand({ Bucket: bucket, Key: operation === 'snapshot' ? backupKey : currentKey, Body: bytes,
          ContentType: source.ContentType, ServerSideEncryption: 'AES256', CacheControl: 'no-store',
          ...(operation === 'restore' && revision ? { IfMatch: revision } : { IfNoneMatch: '*' }) }));
        console.log(`${operation}: ${file}`);
      } catch (error) {
        if (operation === 'snapshot' && error.name === 'NoSuchKey') { console.log(`snapshot: ${file} does not exist; skipped`); continue; }
        throw error;
      }
    }
    console.log(`${operation} finished: ${timestamp}. No document contents or credentials were logged.`);
  }
} finally { client.destroy(); }
