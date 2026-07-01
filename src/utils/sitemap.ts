// Sitemap generation shared by the runtime regenerator (storageService) and the
// build-time script (scripts/generate-sitemap.mjs re-implements this in plain
// JS). Produces a valid urlset covering the public static pages plus every
// active property listing.

import { Property } from '../types';
import { SITE_URL, propertyPath } from './seo';

interface SitemapEntry {
  loc: string;
  changefreq?: string;
  priority?: string;
  lastmod?: string;
}

const STATIC_ENTRIES: SitemapEntry[] = [
  { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
  { loc: `${SITE_URL}/properties`, changefreq: 'daily', priority: '0.9' },
  { loc: `${SITE_URL}/about`, changefreq: 'monthly', priority: '0.6' },
  { loc: `${SITE_URL}/contact`, changefreq: 'monthly', priority: '0.6' },
];

const xmlEscape = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const renderEntry = (entry: SitemapEntry): string => {
  const parts = [`    <loc>${xmlEscape(entry.loc)}</loc>`];
  if (entry.lastmod) parts.push(`    <lastmod>${entry.lastmod}</lastmod>`);
  if (entry.changefreq) parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
  if (entry.priority) parts.push(`    <priority>${entry.priority}</priority>`);
  return `  <url>\n${parts.join('\n')}\n  </url>`;
};

// Build the full sitemap XML string. Only public, indexable listings are
// included (isActive !== false).
export const buildSitemapXml = (properties: Property[]): string => {
  const listingEntries: SitemapEntry[] = (properties || [])
    .filter((p) => p && p.id && p.isActive !== false)
    .map((p) => ({
      loc: `${SITE_URL}${propertyPath(p)}`,
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: (p.updatedAt || p.createdAt || '').slice(0, 10) || undefined,
    }));

  const urls = [...STATIC_ENTRIES, ...listingEntries].map(renderEntry).join('\n');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${urls}\n` +
    '</urlset>\n'
  );
};
