import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv.includes('--dev') ? 'development' : 'production';
const parsed = {};
for (const name of ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]) {
  const file = path.join(root, name);
  if (fs.existsSync(file)) Object.assign(parsed, parse(fs.readFileSync(file)));
}
const effective = { ...parsed, ...process.env };
const forbidden = /^VITE_.*(?:SECRET|PASSWORD|PRIVATE_KEY|ACCESS_KEY|SESSION_TOKEN|DATABASE_URL)|^VITE_(?:HOUSING|MAGICBRICKS).*KEY/i;
const names = Object.keys(effective).filter(name => forbidden.test(name) && effective[name]?.trim());
if (names.length) {
  console.error('Build blocked: private credentials are configured as browser environment variables:');
  names.forEach(name => console.error(`  ${name}`));
  console.error('Remove these variables from Amplify and local frontend .env files. Use the Lambda execution role for AWS access. Values are not printed.');
  process.exit(1);
}
// Catch a reintroduced browser SDK credential literal or an entire env-object
// dump before Vite has a chance to bake private values into static assets.
const violations = [];
function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (/\.[cm]?[jt]sx?$/.test(file)) {
      const source = fs.readFileSync(file, 'utf8');
      if (/VITE_.*(?:AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID)|secretAccessKey\s*:|(?:JSON\.stringify\(|\.\.\.)\s*import\.meta\.env/.test(source)) violations.push(path.relative(root, file));
    }
  }
}
visit(path.join(root, 'src'));
if (violations.length) {
  console.error('Build blocked: unsafe client credential references in:', violations.join(', '));
  process.exit(1);
}
console.log('Client environment safety check passed.');
