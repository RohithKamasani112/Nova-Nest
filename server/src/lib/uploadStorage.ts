import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../env';

// Files are staged between preview (parses + stores) and commit (re-reads +
// writes to DB) since those are two separate HTTP requests. Staged in S3,
// not local disk: on a long-running server (Fly/local) a temp directory
// would work fine, but on Lambda /preview and /commit can land on two
// different execution environments with unrelated, non-shared /tmp
// directories — a locally-staged file could silently 404 on commit
// depending on which container happened to handle which request. S3 is
// visible to every instance identically, so this works the same way
// regardless of deployment target.
const s3 = new S3Client({ region: env.awsRegion });
const PREFIX = 'crm-import-staging';

function objectKey(batchId: string, fileName: string): string {
  return `${PREFIX}/${batchId}/${fileName}`;
}

export async function storeUploadedFile(batchId: string, fileName: string, buffer: Buffer): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.s3BucketName,
      Key: objectKey(batchId, fileName),
      Body: buffer,
    })
  );
}

export async function readStoredFile(batchId: string, fileName: string): Promise<Buffer> {
  const result = await s3.send(
    new GetObjectCommand({
      Bucket: env.s3BucketName,
      Key: objectKey(batchId, fileName),
    })
  );
  const bytes = await result.Body?.transformToByteArray();
  if (!bytes) throw new Error(`Staged import file not found for batch ${batchId}`);
  return Buffer.from(bytes);
}

export async function deleteStoredFile(batchId: string, fileName: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.s3BucketName,
      Key: objectKey(batchId, fileName),
    })
  );
}
