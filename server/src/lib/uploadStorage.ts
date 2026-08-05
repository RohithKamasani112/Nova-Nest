import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// Files are staged between preview (parses + stores) and commit (re-reads +
// writes to DB) since those are two separate HTTP requests. Kept outside the
// repo in the OS temp dir, cleaned up once commit finishes either way.
const BASE_DIR = path.join(os.tmpdir(), 'crm-imports');

export async function storeUploadedFile(batchId: string, fileName: string, buffer: Buffer): Promise<void> {
  const dir = path.join(BASE_DIR, batchId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, fileName), buffer);
}

export async function readStoredFile(batchId: string, fileName: string): Promise<Buffer> {
  return fs.readFile(path.join(BASE_DIR, batchId, fileName));
}

export async function deleteStoredFile(batchId: string): Promise<void> {
  await fs.rm(path.join(BASE_DIR, batchId), { recursive: true, force: true });
}
