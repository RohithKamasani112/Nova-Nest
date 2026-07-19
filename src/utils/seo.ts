// Centralised SEO configuration and helpers.
//
// Everything SEO-related that needs a real value (domain, brand, contact
// details, social handles) lives here so there is exactly ONE place to update
// when things change. Pages and the <Seo> component import from this module.

import { Property } from '../types';
import { toTitleCase } from './format';

// ---------------------------------------------------------------------------
// Site-wide constants
// ---------------------------------------------------------------------------

// Production origin. No trailing slash. Change here if the domain ever moves.
export const SITE_URL = 'https://novanest.co.in';

export const BRAND = {
  name: 'Nova Nest',
  // Full legal/entity name — used everywhere for brand disambiguation so Google
  // learns that "Nova Nest" + "Bangalore real estate" maps to this domain (and
  // not the unrelated furniture / UK-property / AI-voice "Nova Nest" companies).
  legalName: 'Nova Nest Rentals and Property Management',
  // Canonical entity URL used in schema.org `url` fields. The brief specifies
  // the www host for the organisation entity; the site canonicals remain on the
  // apex SITE_URL, and the two hosts resolve to the same site.
  entityUrl: 'https://www.novanest.co.in',
  // Default social-share image. Replace public/og-image.jpg with a real
  // 1200x630 branded image for best link previews (see the manual checklist).
  ogImage: `${SITE_URL}/og-image.jpg`,
  logo: `${SITE_URL}/nova-nest-logo.png`,
  twitter: '@novanest', // update if a real handle exists
  themeColor: '#15211A',
};

export const BUSINESS = {
  phone: '+91-98454-18570',
  altPhone: '+91-96637-95675',
  email: 'novanestpropertymanagement@gmail.com',
  streetAddress:
    'Ground Floor, Site No-29 & 30, Maheshwaramma Temple Road, 1st Main Rd, Maheswari Nagar, Mahadevapura',
  addressLocality: 'Bengaluru',
  addressRegion: 'Karnataka',
  postalCode: '560048',
  addressCountry: 'IN',
  areaServed: ['Whitefield', 'Marathahalli', 'Bellandur', 'Hoodi', 'Mahadevapura', 'Bengaluru'],
  openingHours: 'Mo-Sa 10:00-19:00',
  mapsUrl: 'https://maps.app.goo.gl/V5dSTjfNRgDUWTmEA',
};

// ---------------------------------------------------------------------------
// Slug + URL helpers
// ---------------------------------------------------------------------------

export const slugify = (value: string): string => {
  const slug = (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'property';
};

// Keyword-rich, human-readable slug for a listing, e.g.
// "3bhk-villa-in-whitefield-prop_1720000000000_ab12cd". The id is appended so
// the slug is guaranteed unique and can be resolved back to a property.
export const propertySlug = (p: Property): string => `${slugify(p.title)}-${p.id}`;

export const propertyPath = (p: Property): string => `/property/${propertySlug(p)}`;

export const canonical = (path: string): string => {
  if (!path || path === '/') return `${SITE_URL}/`;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

// Internal "page" identifiers used by App.tsx's state machine.
export type AppPage =
  | 'home'
  | 'properties'
  | 'property-details'
  | 'about'
  | 'contact'
  | 'locality'
  | 'blog'
  | 'blog-post'
  | 'admin-login'
  | 'dashboard'
  | 'add-property'
  | 'manage-properties'
  | 'leads'
  | 'generate-bill'
  | 'settings';

// URL prefix for locality landing pages, e.g. /property-for-rent-in/whitefield.
export const LOCALITY_PATH_PREFIX = '/property-for-rent-in';

export const localityPath = (slug: string): string =>
  `${LOCALITY_PATH_PREFIX}/${slug}`;

export const blogPath = (slug: string): string => `/blog/${slug}`;

// Map an app page (+ optional selected property / content slug) to a real URL
// path. `slug` carries the locality or blog-post identifier for those pages.
export const pathForState = (
  page: AppPage,
  property?: Property | null,
  slug?: string | null
): string => {
  switch (page) {
    case 'home':
      return '/';
    case 'properties':
      return '/properties';
    case 'about':
      return '/about';
    case 'contact':
      return '/contact';
    case 'locality':
      return slug ? localityPath(slug) : '/';
    case 'blog':
      return '/blog';
    case 'blog-post':
      return slug ? blogPath(slug) : '/blog';
    case 'admin-login':
      return '/admin/login';
    case 'dashboard':
      return '/admin/dashboard';
    case 'add-property':
      return '/admin/add-property';
    case 'manage-properties':
      return '/admin/manage-properties';
    case 'leads':
      return '/admin/leads';
    case 'settings':
      return '/admin/settings';
    case 'property-details':
      return property ? propertyPath(property) : '/properties';
    default:
      return '/';
  }
};

export type ParsedRoute =
  | { type: 'page'; page: AppPage }
  | { type: 'property'; slug: string }
  | { type: 'locality'; slug: string }
  | { type: 'blog-post'; slug: string };

// Map a URL path back to an app route. Used for deep-links + back/forward.
export const parsePath = (pathname: string): ParsedRoute => {
  const clean = (pathname || '/').replace(/\/+$/, '') || '/';

  if (clean === '/' || clean === '') return { type: 'page', page: 'home' };
  if (clean === '/properties') return { type: 'page', page: 'properties' };
  if (clean === '/about') return { type: 'page', page: 'about' };
  if (clean === '/contact') return { type: 'page', page: 'contact' };
  if (clean === '/blog') return { type: 'page', page: 'blog' };
  if (clean === '/admin' || clean === '/admin/login') return { type: 'page', page: 'admin-login' };
  if (clean === '/admin/dashboard') return { type: 'page', page: 'dashboard' };
  if (clean === '/admin/add-property') return { type: 'page', page: 'add-property' };
  if (clean === '/admin/manage-properties') return { type: 'page', page: 'manage-properties' };
  if (clean === '/admin/leads') return { type: 'page', page: 'leads' };
  if (clean === '/admin/settings') return { type: 'page', page: 'settings' };

  const blogMatch = clean.match(/^\/blog\/(.+)$/);
  if (blogMatch) return { type: 'blog-post', slug: blogMatch[1] };

  const localityMatch = clean.match(/^\/property-for-rent-in\/(.+)$/);
  if (localityMatch) return { type: 'locality', slug: localityMatch[1] };

  const propMatch = clean.match(/^\/property\/(.+)$/);
  if (propMatch) return { type: 'property', slug: propMatch[1] };

  return { type: 'page', page: 'home' };
};

// Resolve a listing slug back to a Property. Matches on the full computed slug
// first, then falls back to the trailing id (in case the title changed).
export const findPropertyForSlug = (
  properties: Property[],
  slug: string
): Property | null => {
  if (!slug) return null;
  const exact = properties.find((p) => propertySlug(p) === slug);
  if (exact) return exact;
  return properties.find((p) => slug.endsWith(p.id)) || null;
};

// ---------------------------------------------------------------------------
// Meta text builders
// ---------------------------------------------------------------------------

// Trim/pad a description toward the 150-160 char sweet spot without cutting a
// word in half.
export const clampDescription = (text: string, max = 158): string => {
  const collapsed = (text || '').replace(/\s+/g, ' ').trim();
  if (collapsed.length <= max) return collapsed;
  const cut = collapsed.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).trim()}…`;
};

const priceLabel = (p: Property): string => {
  const n = p.price || 0;
  if (p.status === 'rent') return `₹${n.toLocaleString('en-IN')}/month`;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const categoryWord = (p: Property): string => {
  if (p.category === 'land') return 'Plot';
  if (p.category === 'condo') return 'Commercial Property';
  return toTitleCase(p.category);
};

// Unique, data-driven <title> for a listing.
export const propertyTitle = (p: Property): string => {
  const beds = p.bedrooms > 0 ? `${p.bedrooms} BHK ` : '';
  const forWhat = p.status === 'buy' ? 'for Sale' : 'for Rent';
  return `${toTitleCase(p.title)} — ${beds}${categoryWord(p)} ${forWhat} in ${toTitleCase(
    p.location
  )} | ${BRAND.name}`;
};

// Unique, data-driven meta description for a listing.
export const propertyDescription = (p: Property): string => {
  const beds = p.bedrooms > 0 ? `${p.bedrooms} BHK ` : '';
  const area = p.areaSqft > 0 ? `${p.areaSqft.toLocaleString('en-IN')} sqft ` : '';
  const base = `${beds}${area}${categoryWord(p).toLowerCase()} ${
    p.status === 'buy' ? 'for sale' : 'for rent'
  } in ${toTitleCase(p.location)} at ${priceLabel(p)}. ${p.description || ''}`;
  return clampDescription(base);
};

// First usable image for OG/JSON-LD, absolute URL where possible.
export const propertyImage = (p: Property): string => {
  const img = p.images?.find(Boolean);
  if (!img) return BRAND.ogImage;
  return img.startsWith('http') ? img : `${SITE_URL}${img.startsWith('/') ? '' : '/'}${img}`;
};

// ---------------------------------------------------------------------------
// JSON-LD (schema.org) builders — return plain objects; <Seo> stringifies them.
// ---------------------------------------------------------------------------

// The three services Nova Nest offers, surfaced as a schema.org OfferCatalog so
// search engines can associate the entity with each service line.
export const BRAND_SERVICES = ['Property Rental', 'Property Resale', 'Property Management'];

const serviceOfferCatalog = () => ({
  '@type': 'OfferCatalog',
  name: `${BRAND.legalName} Services`,
  itemListElement: BRAND_SERVICES.map((service) => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'Service', name: service },
  })),
});

// Primary RealEstateAgent entity (brief #3). Name is the full legal brand,
// area served is Bangalore, services are the three offer lines, url is the
// canonical entity URL.
export const organizationJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  '@id': `${SITE_URL}/#organization`,
  name: BRAND.legalName,
  alternateName: BRAND.name,
  url: BRAND.entityUrl,
  logo: BRAND.logo,
  image: BRAND.ogImage,
  email: BUSINESS.email,
  telephone: BUSINESS.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: BUSINESS.streetAddress,
    addressLocality: BUSINESS.addressLocality,
    addressRegion: BUSINESS.addressRegion,
    postalCode: BUSINESS.postalCode,
    addressCountry: BUSINESS.addressCountry,
  },
  areaServed: { '@type': 'City', name: 'Bangalore' },
  makesOffer: BRAND_SERVICES.map((service) => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'Service', name: service },
  })),
  hasOfferCatalog: serviceOfferCatalog(),
  sameAs: [] as string[], // add real social profile URLs when available
});

// Matching Organization entity (brief #3) — reinforces the same business name
// for entity recognition / brand disambiguation.
export const brandOrganizationJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#brand-organization`,
  name: BRAND.legalName,
  alternateName: BRAND.name,
  url: BRAND.entityUrl,
  logo: BRAND.logo,
  image: BRAND.ogImage,
  email: BUSINESS.email,
  telephone: BUSINESS.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: BUSINESS.streetAddress,
    addressLocality: BUSINESS.addressLocality,
    addressRegion: BUSINESS.addressRegion,
    postalCode: BUSINESS.postalCode,
    addressCountry: BUSINESS.addressCountry,
  },
  areaServed: { '@type': 'City', name: 'Bangalore' },
  sameAs: [] as string[], // add real social profile URLs when available
});

export const websiteJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: `${SITE_URL}/`,
  name: BRAND.name,
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/properties?location={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

export const localBusinessJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  '@id': `${SITE_URL}/#localbusiness`,
  name: BRAND.legalName,
  url: `${SITE_URL}/contact`,
  image: BRAND.ogImage,
  logo: BRAND.logo,
  email: BUSINESS.email,
  telephone: BUSINESS.phone,
  priceRange: '₹₹',
  address: {
    '@type': 'PostalAddress',
    streetAddress: BUSINESS.streetAddress,
    addressLocality: BUSINESS.addressLocality,
    addressRegion: BUSINESS.addressRegion,
    postalCode: BUSINESS.postalCode,
    addressCountry: BUSINESS.addressCountry,
  },
  areaServed: BUSINESS.areaServed,
  openingHours: BUSINESS.openingHours,
  hasMap: BUSINESS.mapsUrl,
});

const accommodationType = (p: Property): string => {
  switch (p.category) {
    case 'apartment':
      return 'Apartment';
    case 'house':
    case 'villa':
    case 'townhouse':
      return 'House';
    case 'land':
      return 'Place';
    default:
      return 'Residence';
  }
};

export const propertyJsonLd = (p: Property) => {
  const url = canonical(propertyPath(p));
  const images = (p.images || []).filter(Boolean).map((img) =>
    img.startsWith('http') ? img : `${SITE_URL}${img.startsWith('/') ? '' : '/'}${img}`
  );

  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': accommodationType(p),
    name: toTitleCase(p.title),
    description: clampDescription(p.description || propertyDescription(p), 300),
    url,
    image: images.length ? images : [BRAND.ogImage],
    address: {
      '@type': 'PostalAddress',
      addressLocality: toTitleCase(p.location),
      addressRegion: BUSINESS.addressRegion,
      addressCountry: BUSINESS.addressCountry,
    },
    offers: {
      '@type': 'Offer',
      price: p.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url,
      businessFunction:
        p.status === 'rent'
          ? 'http://purl.org/goodrelations/v1#LeaseOut'
          : 'http://purl.org/goodrelations/v1#Sell',
    },
  };

  if (p.bedrooms > 0) node.numberOfBedroomsTotal = p.bedrooms;
  if (p.bathrooms > 0) node.numberOfBathroomsTotal = p.bathrooms;
  if (p.areaSqft > 0) {
    node.floorSize = { '@type': 'QuantitativeValue', value: p.areaSqft, unitCode: 'FTK' };
  }
  if (typeof p.latitude === 'number' && typeof p.longitude === 'number') {
    node.geo = { '@type': 'GeoCoordinates', latitude: p.latitude, longitude: p.longitude };
  }
  return node;
};

// BlogPosting schema for an individual blog post. Author is the brand entity so
// the post ties back to the organisation for E-E-A-T / disambiguation.
export const blogPostingJsonLd = (post: {
  title: string;
  metaDescription: string;
  slug: string;
  author: string;
  date: string;
  image?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.metaDescription,
  url: canonical(blogPath(post.slug)),
  mainEntityOfPage: canonical(blogPath(post.slug)),
  datePublished: post.date,
  dateModified: post.date,
  image: post.image || BRAND.ogImage,
  author: { '@type': 'Organization', name: BRAND.legalName },
  publisher: {
    '@type': 'Organization',
    name: BRAND.legalName,
    logo: { '@type': 'ImageObject', url: BRAND.logo },
  },
});

// breadcrumbs: array of { name, path }
export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: canonical(item.path),
  })),
});
