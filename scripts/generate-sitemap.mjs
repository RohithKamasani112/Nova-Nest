// Build-time sitemap generator.
//
//   node scripts/generate-sitemap.mjs   (or: npm run sitemap)
//
// Fetches the live property list from S3 and writes public/sitemap.xml so the
// deployed static file already contains every listing. The app ALSO regenerates
// sitemap.xml to S3 at runtime on each property change (see storageService), so
// this script is a convenience for deploy-time freshness — it is intentionally
// NOT part of `npm run build`, so a missing-credentials environment can never
// fail the production build.

import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const SITE_URL = process.env.VITE_SITE_URL || 'https://novanest.co.in';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/sitemap.xml');

const isProd = process.env.VITE_IS_PRODUCTION === 'true';
const folder = isProd
  ? process.env.VITE_S3_FOLDER_PROD
  : process.env.VITE_S3_FOLDER_DUMMY;
const bucket = process.env.VITE_S3_BUCKET_NAME;
const region = process.env.VITE_AWS_REGION || 'us-east-1';

const slugify = (v) =>
  (v || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'property';

const xmlEscape = (v) =>
  v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const staticEntries = [
  { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
  { loc: `${SITE_URL}/properties`, changefreq: 'daily', priority: '0.9' },
  { loc: `${SITE_URL}/about`, changefreq: 'monthly', priority: '0.6' },
  { loc: `${SITE_URL}/contact`, changefreq: 'monthly', priority: '0.6' },
];

const renderEntry = (e) => {
  const parts = [`    <loc>${xmlEscape(e.loc)}</loc>`];
  if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`);
  if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
  if (e.priority) parts.push(`    <priority>${e.priority}</priority>`);
  return `  <url>\n${parts.join('\n')}\n  </url>`;
};

const buildXml = (entries) =>
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  entries.map(renderEntry).join('\n') +
  '\n</urlset>\n';

async function fetchProperties() {
  if (!bucket || !folder) {
    console.warn('[sitemap] S3 bucket/folder not configured — writing static-only sitemap.');
    return [];
  }
  const client = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || '',
    },
  });
  const res = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: `${folder}/properties.json` })
  );
  const body = await res.Body.transformToString();
  return JSON.parse(body);
}

try {
  const properties = await fetchProperties();
  const listingEntries = (properties || [])
    .filter((p) => p && p.id && p.isActive !== false)
    .map((p) => ({
      loc: `${SITE_URL}/property/${slugify(p.title)}-${p.id}`,
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: (p.updatedAt || p.createdAt || '').slice(0, 10) || undefined,
    }));

  const xml = buildXml([...staticEntries, ...listingEntries]);
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, xml, 'utf8');
  console.log(`[sitemap] Wrote ${listingEntries.length} listings + ${staticEntries.length} static URLs to public/sitemap.xml`);
} catch (err) {
  console.error('[sitemap] Failed:', err?.message || err);
  process.exitCode = 0; // never fail a pipeline over the sitemap
}
