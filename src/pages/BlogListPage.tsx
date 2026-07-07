import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CalendarDays, Clock, User } from 'lucide-react';
import { Seo } from '../components/Seo';
import {
  postsNewestFirst,
  readingTimeMinutes,
  CATEGORY_THEME,
  type BlogPost,
} from '../data/blog';
import { organizationJsonLd, breadcrumbJsonLd } from '../utils/seo';

interface BlogListPageProps {
  onNavigate: (page: string, slug?: string | null) => void;
}

const formatDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  if (!y || !m || !d) return iso;
  return `${d} ${months[m - 1]} ${y}`;
};

// Category badge — small pill shown on cards and the hero banner.
const CategoryChip: React.FC<{ post: BlogPost; onDark?: boolean }> = ({ post, onDark }) => {
  const theme = CATEGORY_THEME[post.category];
  return (
    <span
      className={
        onDark
          ? 'inline-flex items-center rounded-full bg-cream/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cream backdrop-blur-sm'
          : `inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${theme.chip}`
      }
    >
      {theme.label}
    </span>
  );
};

// Branded gradient hero banner (no image files ship with the project, so each
// post's visual is a category-themed gradient with its alt text as the label).
const HeroBanner: React.FC<{ post: BlogPost; className?: string }> = ({ post, className }) => {
  const theme = CATEGORY_THEME[post.category];
  return (
    <div
      role="img"
      aria-label={post.heroAlt}
      className={`relative flex items-end overflow-hidden ${className || ''}`}
      style={{ background: theme.gradient }}
    >
      {/* subtle texture + readability veil */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
      />
      <div className="relative p-5 sm:p-6">
        <CategoryChip post={post} onDark />
      </div>
    </div>
  );
};

export const BlogListPage: React.FC<BlogListPageProps> = ({ onNavigate }) => {
  const posts = postsNewestFirst();
  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen bg-cream" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Seo
        title="Nova Nest Blog | Real Estate Guides for Renting & Buying in Bangalore"
        description="Guides on renting, buying and selling premium gated-community flats across Bangalore's IT corridors — from Nova Nest Rentals and Property Management."
        path="/blog"
        jsonLd={[
          organizationJsonLd(),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
          ]),
        ]}
      />

      {/* ================= HERO ================= */}
      <section className="bg-header text-cream">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-accent font-bold mb-3">
            Nova Nest Rentals and Property Management
          </p>
          <h1 className="font-serif text-[32px] font-bold leading-[1.12] tracking-tight sm:text-[42px] md:text-5xl">
            Real estate guides for renting &amp; buying in Bangalore
          </h1>
          <p className="mt-5 max-w-2xl font-reading text-[16px] leading-[1.75] text-cream/80 sm:text-[17px]">
            Practical, local advice for renters, buyers and sellers navigating premium
            gated communities across Bangalore's IT corridors — written by the Nova Nest
            Rentals and Property Management team.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        {/* ================= FEATURED ================= */}
        {featured && (
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => onNavigate('blog-post', featured.slug)}
            className="group mb-12 grid w-full overflow-hidden rounded-2xl border border-charcoal/10 bg-white text-left transition-colors hover:border-accent/50 sm:grid-cols-2"
          >
            <HeroBanner post={featured} className="min-h-[180px] sm:min-h-full" />
            <div className="p-6 sm:p-8">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                Latest guide
              </span>
              <h2 className="mt-2 font-serif text-[24px] font-bold leading-snug tracking-tight text-charcoal group-hover:text-accent sm:text-[30px]">
                {featured.title}
              </h2>
              <p className="mt-3 max-w-2xl font-reading text-[16px] leading-[1.7] text-charcoal/70">
                {featured.excerpt}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-charcoal/45">
                <span className="inline-flex items-center gap-1.5">
                  <User size={13} /> {featured.author}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={13} />
                  <time dateTime={featured.date}>{formatDate(featured.date)}</time>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} /> {readingTimeMinutes(featured)} min read
                </span>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                Read guide <ArrowRight size={14} />
              </span>
            </div>
          </motion.button>
        )}

        {/* ================= GRID ================= */}
        <div className="grid gap-6 sm:grid-cols-2">
          {rest.map((post) => (
            <button
              key={post.slug}
              onClick={() => onNavigate('blog-post', post.slug)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-white text-left transition-colors hover:border-accent/50"
            >
              <HeroBanner post={post} className="h-32" />
              <div className="flex flex-1 flex-col p-6">
                <h2 className="font-serif text-xl font-bold leading-snug text-charcoal group-hover:text-accent">
                  {post.title}
                </h2>
                <p className="mt-2 flex-1 font-reading text-[15px] leading-[1.65] text-charcoal/65">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-charcoal/[0.04] px-2.5 py-1 text-[11px] font-medium text-charcoal/55"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-charcoal/45">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={13} />
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={13} /> {readingTimeMinutes(post)} min read
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogListPage;
