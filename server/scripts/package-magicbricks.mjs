import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(new URL('../.magicbricks-package/', import.meta.url), { recursive: true });
await build({ absWorkingDir: root, entryPoints: ['src/integrations/handler.ts'], outfile: '.magicbricks-package/index.js', bundle: true, platform: 'node', target: 'node22', format: 'cjs', external: ['pg-native'], sourcemap: false });
await writeFile(new URL('../.magicbricks-package/package.json', import.meta.url), JSON.stringify({ name: 'nova-nest-magicbricks-lambda', version: '1.0.0', private: true, type: 'commonjs' }));
console.log('Packaged server/.magicbricks-package/index.js; deploy with server/infra/magicbricks.yaml.');
