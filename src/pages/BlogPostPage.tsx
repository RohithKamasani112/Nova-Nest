import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CalendarDays, Clock, MapPin, User } from 'lucide-react';
import { Seo } from '../components/Seo';
import {
  getPostBySlug,
  readingTimeMinutes,
  relatedPosts,
  CATEGORY_THEME,
  AUTHOR_BIO,
} from '../data/blog';
import { getLocalityBySlug } from '../data/localities';
import {
  organizationJsonLd,
  blogPostingJsonLd,
  breadcrumbJsonLd,
  blogPath,
  localityPath,
} from '../utils/seo';

interface BlogPostPageProps {
  slug: string | null;
  onNavigate: (page: string, slug?: string | null) => void;
}

const formatDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  if (!y || !m || !d) return iso;
  return `${d} ${months[m - 1]} ${y}`;
};

export const BlogPostPage: React.FC<BlogPostPageProps> = ({ slug, onNavigate }) => {
  const post = slug ? getPostBySlug(slug) : undefined;

  // Deep-link to an unknown post slug → bounce to the blog listing.
  useEffect(() => {
    if (slug && !post) onNavigate('blog');
  }, [slug, post, onNavigate]);

  if (!post) return null;

  const relatedLocalities = post.relatedLocalities
    .map((s) => getLocalityBySlug(s))
    .filter(Boolean);

  const theme = CATEGORY_THEME[post.category];
  const readingTime = readingTimeMinutes(post);
  const related = relatedPosts(post, 3);

  return (
    <div className="min-h-screen bg-cream" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Seo
        title={post.metaTitle}
        description={post.metaDescription}
        path={blogPath(post.slug)}
        type="article"
        jsonLd={[
          blogPostingJsonLd(post),
          organizationJsonLd(),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: post.title, path: blogPath(post.slug) },
          ]),
        ]}
      />

      {/* ================= HEADER ================= */}
      <article>
        <header className="bg-header text-cream">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
            <button
              onClick={() => onNavigate('blog')}
              className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-cream/70 transition-colors hover:text-accent"
            >
              ← Nova Nest Blog
            </button>
            <span className="inline-flex items-center rounded-full bg-cream/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              {theme.label}
            </span>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="mt-4 max-w-3xl font-serif text-[30px] font-bold leading-[1.15] tracking-tight sm:text-[40px] sm:leading-[1.12]"
            >
              {post.title}
            </motion.h1>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium text-cream/70">
              <span className="inline-flex items-center gap-1.5">
                <User size={14} className="text-accent" /> {post.author}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} className="text-accent" />
                <time dateTime={post.date}>{formatDate(post.date)}</time>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} className="text-accent" /> {readingTime} min read
              </span>
            </div>
          </div>
        </header>

        {/* ===== Hero banner (branded gradient keyed to the category) ===== */}
        <div
          role="img"
          aria-label={post.heroAlt}
          className="relative h-40 w-full overflow-hidden sm:h-56"
          style={{ background: theme.gradient }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          {/* ===== Mandatory brand + location mention block ===== */}
          <div className="mb-11 rounded-2xl border-l-4 border-accent bg-white p-5 sm:p-6">
            <p className="font-reading text-[16px] leading-[1.75] text-charcoal/80">
              <strong className="font-semibold text-charcoal">
                Nova Nest Rentals and Property Management
              </strong>{' '}
              helps buyers, sellers and tenants navigate premium gated communities across
              Bangalore — from Whitefield and the Outer Ring Road to South and North
              Bangalore. This guide is part of how our team shares what we learn on the
              ground every day.
            </p>
          </div>

          {/* ===== Body ===== */}
          <div className="space-y-11">
            {post.sections.map((section, si) => (
              <section key={section.heading} className="scroll-mt-24">
                <h2 className="font-serif text-[26px] font-bold leading-snug tracking-tight text-charcoal sm:text-[30px]">
                  {section.heading}
                </h2>
                <span
                  aria-hidden="true"
                  className="mt-3 block h-0.5 w-10 rounded-full bg-accent/70"
                />
                {section.paragraphs?.map((para, i) => (
                  <p
                    key={i}
                    className={
                      si === 0 && i === 0
                        ? 'mt-4 font-reading text-[20px] leading-[1.75] text-charcoal/90'
                        : 'mt-4 font-reading text-[18px] leading-[1.85] text-charcoal/80'
                    }
                  >
                    {para}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="mt-5 space-y-3">
                    {section.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex gap-3 font-reading text-[18px] leading-[1.7] text-charcoal/80"
                      >
                        <span className="mt-[13px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* ===== Tags ===== */}
          {post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-charcoal/[0.05] px-3 py-1.5 text-[12px] font-medium text-charcoal/60"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* ===== Scaffold notice (only while full copy is pending) ===== */}
          {post.status === 'scaffold' && (
            <p className="mt-10 rounded-xl bg-accent/10 p-4 text-[13px] leading-6 text-charcoal/60">
              This guide's full article is being finalised by the Nova Nest Rentals and
              Property Management editorial team. Meanwhile, our advisors can answer your
              questions directly — <button onClick={() => onNavigate('contact')} className="font-semibold text-accent underline">get in touch</button>.
            </p>
          )}

          {/* ===== Author box (E-E-A-T) ===== */}
          <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-charcoal/10 bg-white p-6 sm:flex-row sm:items-start sm:gap-5">
            <div
              aria-hidden="true"
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-cream"
              style={{ background: theme.gradient }}
            >
              NN
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                Written by
              </p>
              <h2 className="mt-1 font-serif text-lg font-bold text-charcoal">
                {post.author}
              </h2>
              <p className="mt-2 font-reading text-[15px] leading-[1.7] text-charcoal/70">
                {AUTHOR_BIO}
              </p>
            </div>
          </div>

          {/* ===== Related locality links (two-way linking) ===== */}
          {relatedLocalities.length > 0 && (
            <div className="mt-12 rounded-2xl border border-charcoal/10 bg-white p-6">
              <h2 className="font-serif text-xl font-bold text-charcoal">
                Explore these areas with Nova Nest
              </h2>
              <p className="mt-1 text-sm text-charcoal/55">
                Premium 2, 3 &amp; 4 BHK flats for rent and sale in gated communities.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {relatedLocalities.map((loc) => (
                  <a
                    key={loc!.slug}
                    href={localityPath(loc!.slug)}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('locality', loc!.slug);
                    }}
                    className="group flex items-center justify-between gap-2 rounded-xl border border-charcoal/10 px-4 py-3 transition-colors hover:border-accent/50"
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal group-hover:text-accent">
                      <MapPin size={15} className="text-accent" />
                      {loc!.name}
                    </span>
                    <ArrowRight size={15} className="text-charcoal/30 group-hover:text-accent" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ===== Related guides (internal linking for SEO) ===== */}
          {related.length > 0 && (
            <div className="mt-12">
              <h2 className="font-serif text-xl font-bold text-charcoal">
                Related guides
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {related.map((rp) => (
                  <a
                    key={rp.slug}
                    href={blogPath(rp.slug)}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('blog-post', rp.slug);
                    }}
                    className="group flex flex-col overflow-hidden rounded-xl border border-charcoal/10 bg-white transition-colors hover:border-accent/50"
                  >
                    <div
                      aria-hidden="true"
                      className="h-20 w-full"
                      style={{ background: CATEGORY_THEME[rp.category].gradient }}
                    />
                    <div className="flex flex-1 flex-col p-4">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
                        {CATEGORY_THEME[rp.category].label}
                      </span>
                      <h3 className="mt-1.5 font-serif text-[15px] font-bold leading-snug text-charcoal group-hover:text-accent">
                        {rp.title}
                      </h3>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ===== CTA ===== */}
          <div className="mt-12 rounded-2xl bg-header p-8 text-center text-cream">
            <h2 className="font-serif text-2xl font-bold">
              Renting, buying or selling in Bangalore?
            </h2>
            <p className="mx-auto mt-3 max-w-xl font-reading text-[15px] leading-[1.7] text-cream/75">
              Nova Nest Rentals and Property Management guides you through premium
              gated-community homes across the city. Tell us what you're looking for.
            </p>
            <button
              onClick={() => onNavigate('contact')}
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-md bg-accent px-7 py-3 text-sm font-bold text-charcoal transition-colors hover:bg-accent/90"
            >
              Contact Nova Nest <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogPostPage;
