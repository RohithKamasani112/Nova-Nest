import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Building2,
  MapPin,
  Sparkles,
  Train,
} from 'lucide-react';
import { Seo } from '../components/Seo';
import { TenantOnboardingChecklist } from '../components/TenantOnboardingChecklist';
import { getLocalityBySlug, LOCALITIES } from '../data/localities';
import { getPostBySlug } from '../data/blog';
import {
  organizationJsonLd,
  breadcrumbJsonLd,
  localityPath,
} from '../utils/seo';

interface LocalityPageProps {
  slug: string | null;
  onNavigate: (page: string, slug?: string | null) => void;
}

const RangeRow: React.FC<{ label: string; rent: string; sale: string }> = ({
  label,
  rent,
  sale,
}) => (
  <tr className="border-t border-charcoal/10">
    <th scope="row" className="py-3 pr-4 text-left font-semibold text-charcoal">
      {label}
    </th>
    <td className="py-3 pr-4 text-charcoal/70">{rent}</td>
    <td className="py-3 text-charcoal/70">{sale}</td>
  </tr>
);

export const LocalityPage: React.FC<LocalityPageProps> = ({ slug, onNavigate }) => {
  const locality = slug ? getLocalityBySlug(slug) : undefined;

  // Deep-link to an unknown locality slug → bounce to the properties page.
  useEffect(() => {
    if (slug && !locality) onNavigate('properties');
  }, [slug, locality, onNavigate]);

  if (!locality) return null;

  const relatedPosts = locality.relatedBlog
    .map((s) => getPostBySlug(s))
    .filter(Boolean);

  // A few nearby localities in the same zone for cross-linking.
  const nearby = LOCALITIES.filter(
    (l) => l.zone === locality.zone && l.slug !== locality.slug
  ).slice(0, 4);

  const title = locality.metaTitle;
  const description = locality.metaDescription;

  return (
    <div className="min-h-screen bg-cream" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Seo
        title={title}
        description={description}
        path={localityPath(locality.slug)}
        jsonLd={[
          organizationJsonLd(),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: `Property in ${locality.name}`, path: localityPath(locality.slug) },
          ]),
        ]}
      />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-header text-cream">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(1200px 400px at 80% -10%, rgba(201,163,95,0.35), transparent), radial-gradient(900px 500px at 0% 120%, rgba(201,163,95,0.18), transparent)',
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <button
            onClick={() => onNavigate('home')}
            className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-cream/70 transition-colors hover:text-accent"
          >
            <MapPin size={14} /> {locality.zone}
          </button>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-3xl font-bold leading-tight sm:text-4xl md:text-5xl"
          >
            Premium 2, 3 &amp; 4 BHK Flats for Rent &amp; Sale in {locality.name} Gated
            Communities
          </motion.h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-cream/80 sm:text-base">
            {locality.intro}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('contact')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-bold text-charcoal transition-colors hover:bg-accent/90"
            >
              Talk to a {locality.name} real estate agent
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onNavigate('properties')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-cream/25 px-6 py-3 text-sm font-semibold text-cream transition-colors hover:border-accent hover:text-accent"
            >
              Browse listings
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        {/* ================= RENTAL / SALE GUIDE ================= */}
        <section aria-labelledby="guide-heading">
          <p className="text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-2">
            {locality.name} rental &amp; price guide
          </p>
          <h2 id="guide-heading" className="font-serif text-2xl font-bold text-charcoal sm:text-3xl">
            Homes for sale &amp; rent in {locality.name}, Bangalore
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-charcoal/65">
            Indicative 2026 ranges for premium gated-community homes in {locality.name}. Nova
            Nest Rentals and Property Management verifies live pricing for you before every
            visit — figures below are guide ranges, not quotes.
          </p>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-charcoal/10 bg-white p-1">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-left text-[12px] uppercase tracking-wide text-charcoal/45">
                  <th className="px-4 py-3 font-semibold">Configuration</th>
                  <th className="px-4 py-3 font-semibold">Monthly rent</th>
                  <th className="px-4 py-3 font-semibold">Sale / resale</th>
                </tr>
              </thead>
              <tbody className="[&_th]:px-4 [&_td]:px-4">
                <RangeRow label="2 BHK" rent={locality.rent.bhk2} sale={locality.sale.bhk2} />
                <RangeRow label="3 BHK" rent={locality.rent.bhk3} sale={locality.sale.bhk3} />
                <RangeRow label="4 BHK" rent={locality.rent.bhk4} sale={locality.sale.bhk4} />
              </tbody>
            </table>
          </div>
        </section>

        {/* ================= AMENITIES / CONNECTIVITY / HIGHLIGHTS ================= */}
        <section className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-charcoal/10 bg-white p-6">
            <div className="mb-3 flex items-center gap-2 text-accent">
              <Building2 size={18} />
              <h2 className="font-serif text-lg font-bold text-charcoal">Amenities</h2>
            </div>
            <ul className="space-y-2 text-sm text-charcoal/70">
              {locality.amenities.map((a) => (
                <li key={a} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-charcoal/10 bg-white p-6">
            <div className="mb-3 flex items-center gap-2 text-accent">
              <Train size={18} />
              <h2 className="font-serif text-lg font-bold text-charcoal">Connectivity</h2>
            </div>
            <ul className="space-y-2 text-sm text-charcoal/70">
              {locality.connectivity.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-charcoal/10 bg-white p-6">
            <div className="mb-3 flex items-center gap-2 text-accent">
              <Sparkles size={18} />
              <h2 className="font-serif text-lg font-bold text-charcoal">Why live here</h2>
            </div>
            <ul className="space-y-2 text-sm text-charcoal/70">
              {locality.highlights.map((h) => (
                <li key={h} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ================= TENANT ONBOARDING CHECKLIST ================= */}
        <section className="mt-12">
          <TenantOnboardingChecklist localityName={locality.name} />
        </section>

        {/* ================= RELATED BLOG (two-way linking) ================= */}
        {relatedPosts.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl font-bold text-charcoal">
              Reading for {locality.name} renters &amp; buyers
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {relatedPosts.map((post) => (
                <button
                  key={post!.slug}
                  onClick={() => onNavigate('blog-post', post!.slug)}
                  className="group flex flex-col rounded-2xl border border-charcoal/10 bg-white p-5 text-left transition-colors hover:border-accent/50"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                    Guide
                  </span>
                  <span className="mt-1 font-semibold text-charcoal group-hover:text-accent">
                    {post!.title}
                  </span>
                  <span className="mt-2 text-sm leading-6 text-charcoal/60">
                    {post!.excerpt}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                    Read guide <ArrowRight size={14} />
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ================= NEARBY LOCALITIES ================= */}
        {nearby.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-xl font-bold text-charcoal">
              Explore nearby in {locality.zone}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {nearby.map((l) => (
                <a
                  key={l.slug}
                  href={localityPath(l.slug)}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('locality', l.slug);
                  }}
                  className="rounded-full border border-charcoal/15 px-4 py-2 text-[13px] font-medium text-charcoal transition-colors hover:border-accent hover:text-accent"
                >
                  {l.name}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ================= CTA ================= */}
        <section className="mt-14 rounded-2xl bg-header p-8 text-center text-cream sm:p-10">
          <h2 className="font-serif text-2xl font-bold sm:text-3xl">
            Find your home in {locality.name}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-cream/75">
            Tell us your budget and move-in date. Nova Nest Rentals and Property Management
            will shortlist verified 2, 3 &amp; 4 BHK gated-community flats in {locality.name}
            and arrange your visits.
          </p>
          <button
            onClick={() => onNavigate('contact')}
            className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-md bg-accent px-7 py-3 text-sm font-bold text-charcoal transition-colors hover:bg-accent/90"
          >
            Contact our {locality.name} team
            <ArrowRight size={16} />
          </button>
        </section>
      </div>
    </div>
  );
};

export default LocalityPage;
