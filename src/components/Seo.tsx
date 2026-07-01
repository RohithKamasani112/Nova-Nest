import { useEffect, type FC } from 'react';
import { SITE_URL, BRAND, canonical as toCanonical } from '../utils/seo';

// Dependency-free document-head manager.
//
// This app is a client-rendered SPA, so we can't set per-page meta on the
// server. Instead this component imperatively writes the head tags whenever a
// page mounts/updates. Googlebot renders JS and will read these; note that
// non-rendering social scrapers (WhatsApp/Facebook) only see the STATIC tags in
// index.html — see the SEO notes for the prerender tradeoff.
//
// Singleton tags (title/description/canonical/OG/Twitter) are upserted and left
// in place (last writer wins). JSON-LD scripts are tagged with data-seo and
// fully replaced on each update so stale schema never accumulates.

export interface SeoProps {
  title: string;
  description: string;
  /** Path only, e.g. "/properties". Canonical is derived from SITE_URL. */
  path?: string;
  /** Absolute or root-relative image URL for social cards. */
  image?: string;
  /** og:type — "website" for pages, "article"/"product" where relevant. */
  type?: string;
  /** Set true on filtered/query-param variants that shouldn't be indexed. */
  noindex?: boolean;
  /** schema.org objects to emit as <script type="application/ld+json">. */
  jsonLd?: Array<Record<string, unknown>>;
}

const upsertMeta = (
  attr: 'name' | 'property',
  key: string,
  content: string
): void => {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const upsertLink = (rel: string, href: string): void => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

export const Seo: FC<SeoProps> = ({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  noindex = false,
  jsonLd = [],
}) => {
  useEffect(() => {
    const url = toCanonical(path);
    const img = image
      ? image.startsWith('http')
        ? image
        : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`
      : BRAND.ogImage;

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow');
    upsertLink('canonical', url);

    // Open Graph
    upsertMeta('property', 'og:site_name', BRAND.name);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', img);
    upsertMeta('property', 'og:locale', 'en_IN');

    // Twitter
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', img);
    if (BRAND.twitter) upsertMeta('name', 'twitter:site', BRAND.twitter);

    // JSON-LD — remove any previously injected by this component, then add.
    const previous = document.head.querySelectorAll('script[data-seo="jsonld"]');
    previous.forEach((node) => node.remove());
    const created: HTMLScriptElement[] = [];
    jsonLd.filter(Boolean).forEach((obj) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', 'jsonld');
      script.text = JSON.stringify(obj);
      document.head.appendChild(script);
      created.push(script);
    });

    return () => {
      created.forEach((node) => node.remove());
    };
    // Re-run whenever the meaningful inputs change.
  }, [title, description, path, image, type, noindex, JSON.stringify(jsonLd)]);

  return null;
};

export default Seo;
