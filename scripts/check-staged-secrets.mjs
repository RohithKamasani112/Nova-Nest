import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parse } from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const winGit = path.join(process.env.ProgramFiles || 'C:/Program Files', 'Git/cmd/git.exe');
const git = process.env.GIT_BIN || (process.platform === 'win32' && fs.existsSync(winGit) ? winGit : 'git');
const cwd = process.env.SECRET_SCAN_REPO_DIR || root;
const privateValues = new Set();
const collect = values => {
  for (const [key, value] of Object.entries(values)) if (/SECRET|PASSWORD|PRIVATE_KEY|ACCESS_KEY|SESSION_TOKEN|DATABASE_URL/i.test(key) && value && value.length >= 12) {
    privateValues.add(value);
    if (/DATABASE_URL/i.test(key)) { try { const password = decodeURIComponent(new URL(value).password); if (password.length >= 12) privateValues.add(password); } catch { /* Non-URL placeholder. */ } }
  }
};
collect(process.env);
for (const name of fs.readdirSync(cwd).filter(name => /^\.env(?:\..+)?$/.test(name) && name !== '.env.example')) {
  const file = path.join(cwd, name); if (fs.statSync(file).isFile()) collect(parse(fs.readFileSync(file)));
}
try {
  const names = execFileSync(git, ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).split('\0').filter(Boolean);
  const flagged = [];
  for (const name of names) {
    const base = path.posix.basename(name);
    const forbidden = (base === '.env' || base.startsWith('.env.') && base !== '.env.example') ||
      /^server\/(?:\.lambda-env\.json|\.lambda-package\/|lambda-deploy\.zip|awscliv2\.zip)/.test(name) || /(^|\/)\.aws\/credentials$/.test(name);
    if (forbidden) { flagged.push(name); continue; }
    if (!/\.(?:[cm]?[jt]sx?|json|md|txt|ya?ml|toml|pem|key|html|xml)$/.test(name)) continue;
    const content = execFileSync(git, ['show', `:${name}`], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 15 * 1024 * 1024 });
    if (/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b|npg_[A-Za-z0-9]{10,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content) || [...privateValues].some(value => content.includes(value))) flagged.push(name);
  }
  if (flagged.length) {
    console.error('Commit blocked: possible credentials or private/generated files. Values are not printed.');
    flagged.forEach(name => console.error(`  ${name}`));
    process.exitCode = 1;
  } else console.log('Staged secret scan passed.');
} catch {
  console.error('Cannot inspect staged files. Check that Git is installed and this is a Git checkout.');
  process.exitCode = 1;
}
