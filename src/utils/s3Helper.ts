import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from './config';

// Initialize S3 Client
let s3Client: S3Client | null = null;

const trimSlashes = (value: string): string => value.replace(/^\/+|\/+$/g, '');

const getObjectKey = (path: string): string => {
  if (/^https?:\/\//i.test(path)) {
    const url = new URL(path);
    return decodeURIComponent(url.pathname.replace(/^\/+/, ''));
  }

  const cleanPath = trimSlashes(path);
  const folderName = trimSlashes(config.aws.s3.folderName);

  // Safety: never write/read at the bucket root. An empty folder name means the
  // environment is misconfigured (VITE_S3_FOLDER_DUMMY / _PROD not loaded) — fail
  // loudly instead of silently scattering objects into the bucket root.
  if (!folderName) {
    throw new Error(
      'S3 folder name is empty. Set VITE_S3_FOLDER_DUMMY / VITE_S3_FOLDER_PROD in .env and restart the dev server.'
    );
  }

  if (cleanPath === folderName || cleanPath.startsWith(`${folderName}/`)) {
    return cleanPath;
  }

  return `${folderName}/${cleanPath}`;
};

const getS3Client = (): S3Client => {
  if (!s3Client) {
    // SECURITY: these credentials come from VITE_* env vars, which Vite inlines
    // into the client bundle at build time. A long-lived AWS secret used here is
    // therefore visible to anyone who loads the site. This is only acceptable for
    // local/dev use — a production build must NOT ship a real secret. Warn loudly
    // if that happens so it can't pass silently. See SECURITY.md for the fix
    // (move S3 writes behind a backend/Cognito so no secret reaches the browser).
    if (import.meta.env.PROD && config.aws.secretAccessKey) {
      console.error(
        '[SECURITY] A real AWS secret key is embedded in this production bundle ' +
          'and is publicly readable. Remove VITE_AWS_SECRET_ACCESS_KEY from the ' +
          'build and route S3 writes through a backend. See SECURITY.md.'
      );
    }
    s3Client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
  }
  return s3Client;
};

// Upload file to S3
export const uploadToS3 = async (
  file: File,
  path: string
): Promise<string> => {
  try {
    const client = getS3Client();
    const key = getObjectKey(path);
    const fileBody = new Uint8Array(await file.arrayBuffer());

    const command = new PutObjectCommand({
      Bucket: config.aws.s3.bucketName,
      Key: key,
      Body: fileBody,
      ContentType: file.type,
    });

    await client.send(command);

    // Return the S3 URL
    return `https://${config.aws.s3.bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
};

// Get file from S3
export const getFromS3 = async (path: string): Promise<string> => {
  try {
    const client = getS3Client();
    const key = getObjectKey(path);

    const command = new GetObjectCommand({
      Bucket: config.aws.s3.bucketName,
      Key: key,
    });

    const response = await client.send(command);
    
    // Handle response body for browser compatibility
    if (response.Body === null || response.Body === undefined) {
      return '';
    }
    
    // If Body is a Blob (browser), use text() method
    if (typeof response.Body.text === 'function') {
      return await response.Body.text();
    }
    
    // Otherwise use transformToString (Node.js compatibility)
    const bodyContents = await response.Body.transformToString();
    return bodyContents || '';
  } catch (error) {
    console.error('Error getting from S3:', error);
    throw new Error('Failed to get file from S3');
  }
};

// Get signed URL for private files
export const getSignedS3Url = async (
  path: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const client = getS3Client();
    const key = getObjectKey(path);

    const command = new GetObjectCommand({
      Bucket: config.aws.s3.bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
};

// Delete file from S3
export const deleteFromS3 = async (path: string): Promise<void> => {
  try {
    const client = getS3Client();
    const key = getObjectKey(path);

    const command = new DeleteObjectCommand({
      Bucket: config.aws.s3.bucketName,
      Key: key,
    });

    await client.send(command);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
};

// List files in S3 folder
export const listS3Files = async (prefix: string): Promise<string[]> => {
  try {
    const client = getS3Client();
    const key = getObjectKey(prefix);

    const command = new ListObjectsV2Command({
      Bucket: config.aws.s3.bucketName,
      Prefix: key,
    });

    const response = await client.send(command);
    return response.Contents?.map((item) => item.Key || '') || [];
  } catch (error) {
    console.error('Error listing S3 files:', error);
    throw new Error('Failed to list S3 files');
  }
};

// Upload JSON data to S3
export const uploadJsonToS3 = async (
  data: any,
  path: string
): Promise<void> => {
  try {
    const client = getS3Client();
    const key = getObjectKey(path);

    const command = new PutObjectCommand({
      Bucket: config.aws.s3.bucketName,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    });

    await client.send(command);
  } catch (error) {
    console.error('Error uploading JSON to S3:', error);
    throw new Error('Failed to upload JSON to S3');
  }
};

// Upload a plain-text/other file (e.g. sitemap.xml) to S3. `contentType`
// controls how the object is served; `publicRead` requests public readability
// so files like the sitemap can be fetched by crawlers.
export const uploadTextToS3 = async (
  content: string,
  path: string,
  contentType: string = 'text/plain'
): Promise<string> => {
  const client = getS3Client();
  const key = getObjectKey(path);

  const command = new PutObjectCommand({
    Bucket: config.aws.s3.bucketName,
    Key: key,
    Body: content,
    ContentType: contentType,
    CacheControl: 'public, max-age=300',
  });

  await client.send(command);
  return `https://${config.aws.s3.bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;
};

// Get JSON data from S3
export const getJsonFromS3 = async <T>(path: string): Promise<T> => {
  try {
    const jsonString = await getFromS3(path);
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error getting JSON from S3:', error);
    throw new Error('Failed to get JSON from S3');
  }
};
