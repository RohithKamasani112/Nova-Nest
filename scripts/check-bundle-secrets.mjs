import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.resolve(root, process.env.SECRET_SCAN_DIR || 'dist');
if (!fs.existsSync(dist)) { console.error('Secret scan failed: build directory is missing.'); process.exit(1); }
const secrets = new Set();
const sensitive = /SECRET|PASSWORD|PRIVATE_KEY|ACCESS_KEY|SESSION_TOKEN|DATABASE_URL/i;
const collect = values => {
  for (const [key, value] of Object.entries(values)) if (sensitive.test(key) && value && value.length >= 12) secrets.add(value);
};
collect(process.env);
for (const name of fs.readdirSync(root).filter(name => /^\.env(?:\..+)?$/.test(name) && name !== '.env.example')) {
  const file = path.join(root, name);
  if (fs.statSync(file).isFile()) collect(parse(fs.readFileSync(file)));
}
const failures = [];
function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (/\.(?:js|mjs|cjs|map|html|json|txt|xml|css)$/.test(file)) {
      const data = fs.readFileSync(file, 'utf8');
      const pattern = /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b|npg_[A-Za-z0-9]{10,}|postgres(?:ql)?:\/\/[^\s:"']+:[^\s@"']+@|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;
      if (pattern.test(data) || [...secrets].some(secret => data.includes(secret))) failures.push(path.relative(root, file));
    }
  }
}
visit(dist);
if (failures.length) {
  console.error('Build blocked: possible credentials in generated files. Secret values are not printed.');
  failures.forEach(file => console.error(`  ${file}`));
  process.exit(1);
}
console.log('Production bundle secret scan passed.');
