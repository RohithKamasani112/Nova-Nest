import React, { useRef, useState } from 'react';
import { Property } from '../../types';
import { Bath, BedDouble, Eye, MapPin, Maximize2 } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cardReveal, EASE_ELEGANT } from '../../lib/animation';
import { toTitleCase, propertyDealSummary } from '../../utils/format';
import noImage from '../../assets/no-image.png';
import { UrgentBadge } from './UrgentBadge';

interface PropertyCardProps {
  property: Property;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
  onClick?: () => void;
  index?: number;
  // "Properties Near Me" list view: a formatted distance (e.g. "2.3 km away")
  // and whether this card's map pin is the one currently selected.
  distanceLabel?: string;
  isActive?: boolean;
  onHoverChange?: (hovering: boolean) => void;
}

const formatPrice = (property: Property): string => {
  if (property.status === 'rent') return `₹${property.price.toLocaleString()}/month`;
  if (property.price >= 10000000) return `₹${(property.price / 10000000).toFixed(2)} Cr`;
  if (property.price >= 100000) return `₹${(property.price / 100000).toFixed(2)} L`;
  return `₹${property.price.toLocaleString()}`;
};

const categoryLabel = (category: Property['category']) => {
  if (category === 'land') return 'Plot';
  if (category === 'condo') return 'Commercial';
  return category.charAt(0).toUpperCase() + category.slice(1);
};

type Ripple = { id: number; x: number; y: number };

/**
 * Button that emits a material-style ripple on click (spec #14). The ripple
 * expands from the click point (scale 0 -> 2.5) while fading out, then removes
 * itself. Honors reduced-motion by skipping the ripple entirely.
 */
const RippleButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { rippleColor?: string }
> = ({ children, onClick, className, rippleColor = 'rgba(255,255,255,0.55)', ...rest }) => {
  const reduce = useReducedMotion();
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!reduce) {
      const rect = event.currentTarget.getBoundingClientRect();
      const id = nextId.current++;
      setRipples((prev) => [
        ...prev,
        { id, x: event.clientX - rect.left, y: event.clientY - rect.top },
      ]);
    }
    onClick?.(event);
  };

  return (
    <button {...rest} onClick={handleClick} className={`relative overflow-hidden ${className ?? ''}`}>
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            onAnimationComplete={() =>
              setRipples((prev) => prev.filter((r) => r.id !== ripple.id))
            }
            style={{
              position: 'absolute',
              left: ripple.x,
              top: ripple.y,
              width: 120,
              height: 120,
              marginLeft: -60,
              marginTop: -60,
              borderRadius: '9999px',
              background: rippleColor,
              pointerEvents: 'none',
            }}
          />
        ))}
      </AnimatePresence>
      <span className="relative z-10 flex h-full w-full items-center justify-center">{children}</span>
    </button>
  );
};

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onClick,
  distanceLabel,
  isActive,
  onHoverChange,
}) => {
  const reduce = useReducedMotion();
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleActionClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onClick?.();
  };

  // Sell listings show a small per-sqft sub-label under the price (Section 2).
  const showPerSqft = property.status === 'buy' && (property.pricePerSqft ?? 0) > 0;

  return (
    <motion.article
      variants={reduce ? undefined : cardReveal}
      layout={!reduce}
      whileHover={reduce ? undefined : { y: -6, boxShadow: '0 16px 40px rgba(15,31,61,0.14)' }}
      transition={{ duration: 0.3, ease: EASE_ELEGANT }}
      onClick={onClick}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.();
        }
      }}
      className={`card group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)] transition-shadow ${
        isActive ? 'ring-2 ring-primary' : ''
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Mobile compact layout (below sm): horizontal thumbnail + tight details ── */}
      <div className="flex sm:hidden">
        <div className="relative aspect-[4/3] w-3/5 flex-shrink-0 overflow-hidden bg-black/5">
          <img
            src={property.images?.[0] || noImage}
            alt={`${toTitleCase(property.title)} — ${categoryLabel(property.category)} ${
              property.status === 'buy' ? 'for sale' : 'for rent'
            } in ${toTitleCase(property.location)}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <span
            className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] ${
              property.featured ? 'bg-charcoal text-accent' : 'bg-accent text-charcoal'
            }`}
          >
            {property.featured ? 'New Launch' : categoryLabel(property.category)}
          </span>
          {property.urgent && (
            <UrgentBadge
              reduce={reduce}
              className="absolute right-1.5 top-1.5"
              label={property.status === 'rent' ? 'Urgent Rent' : 'Urgent Sale'}
            />
          )}
        </div>

        <div className="flex w-2/5 min-w-0 flex-col justify-center gap-1 p-2.5">
          <h3 className="line-clamp-1 text-[13px] font-bold leading-tight text-text-primary">
            {toTitleCase(property.title)}
          </h3>

          <span className={`w-fit whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.03em] ${
            property.status === 'rent' ? 'bg-primary/10 text-primary' : 'bg-gold/15 text-gold'
          }`}>
            {propertyDealSummary(property)}
          </span>

          <div className="flex items-center gap-1">
            <MapPin size={11} className="flex-shrink-0 text-gold" />
            <span className="truncate text-[10px] font-medium text-muted-foreground">
              {toTitleCase(property.location)}
            </span>
          </div>
          {distanceLabel && (
            <span className="text-[10px] font-semibold text-primary">{distanceLabel}</span>
          )}

          <p className="text-sm font-extrabold leading-none text-text-primary">{formatPrice(property)}</p>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-semibold text-muted-foreground">
            {property.bedrooms > 0 && (
              <span className="flex items-center gap-0.5">
                <BedDouble size={11} /> {property.bedrooms}
              </span>
            )}
            {property.bathrooms > 0 && (
              <span className="flex items-center gap-0.5">
                <Bath size={11} /> {property.bathrooms}
              </span>
            )}
          </div>

          <div className="mt-0.5 flex flex-col gap-1">
            <button
              onClick={handleActionClick}
              className="w-full rounded-full bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-[0.04em] text-white transition-colors hover:bg-primary-dark"
            >
              Enquire
            </button>
            <button
              onClick={handleActionClick}
              className="w-full rounded-full border border-charcoal/25 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.04em] text-charcoal transition-colors hover:border-charcoal/40"
            >
              Book Visit
            </button>
          </div>
        </div>
      </div>

      {/* ── Tablet / desktop layout (sm and up): unchanged vertical card ── */}
      <div className="hidden sm:block">
      <div className="relative aspect-[4/3] overflow-hidden bg-black/5">
        <motion.img
          layoutId={`property-image-${property.id}`}
          src={property.images?.[0] || noImage}
          alt={`${toTitleCase(property.title)} — ${categoryLabel(property.category)} ${
            property.status === 'buy' ? 'for sale' : 'for rent'
          } in ${toTitleCase(property.location)}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          initial={reduce ? false : { opacity: 0 }}
          animate={reduce ? undefined : { opacity: imgLoaded ? 1 : 0 }}
          whileHover={reduce ? undefined : { scale: 1.06 }}
          transition={{ duration: 0.6, ease: EASE_ELEGANT }}
          className="card-img h-full w-full object-cover"
        />

        <div className="absolute left-3 top-3">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.05em] ${
              property.featured ? 'bg-charcoal text-accent' : 'bg-accent text-charcoal'
            }`}
          >
            {property.featured ? 'New Launch' : categoryLabel(property.category)}
          </span>
        </div>

        {property.urgent && (
          <UrgentBadge
            reduce={reduce}
            className="absolute right-3 top-3"
            label={property.status === 'rent' ? 'Urgent Rent' : 'Urgent Sale'}
          />
        )}

        <button
          onClick={handleActionClick}
          className="absolute bottom-3 right-3 flex min-h-[44px] items-center gap-1.5 rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold text-charcoal shadow transition-colors hover:bg-white"
          aria-label={`View ${property.title}`}
        >
          <Eye size={14} />
          View
        </button>
      </div>

      <div className="p-4 pb-4">
        <h3 className="mb-1 line-clamp-1 text-base font-bold leading-tight tracking-normal text-text-primary">
          {toTitleCase(property.title)}
        </h3>

        <span className={`mb-1.5 inline-block w-fit rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em] ${
          property.status === 'rent' ? 'bg-primary/10 text-primary' : 'bg-gold/15 text-gold'
        }`}>
          {propertyDealSummary(property)}
        </span>

        <div className="mb-2 flex items-center gap-1">
          <MapPin size={14} className="flex-shrink-0 text-gold" />
          <span className="truncate text-xs font-medium text-muted-foreground">{toTitleCase(property.location)}</span>
          {distanceLabel && (
            <span className="flex-shrink-0 text-xs font-semibold text-primary">· {distanceLabel}</span>
          )}
        </div>

        <div className="mb-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-3">
          {property.bedrooms > 0 && (
            <div className="flex items-center gap-1.5">
              <BedDouble size={16} className="text-muted-foreground" />
              <span className="text-sm font-semibold text-text-primary">{property.bedrooms} BHK</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center gap-1.5">
              <Bath size={16} className="text-muted-foreground" />
              <span className="text-sm font-semibold text-text-primary">{property.bathrooms} Bath</span>
            </div>
          )}
          {property.areaSqft > 0 && (
            <div className="flex items-center gap-1.5">
              <Maximize2 size={16} className="text-muted-foreground" />
              <span className="text-sm font-semibold text-text-primary">{property.areaSqft.toLocaleString()} sqft</span>
            </div>
          )}
        </div>

        <div className="mb-3 min-w-0">
          <p className="text-xl font-extrabold leading-none tracking-normal text-text-primary">
            {formatPrice(property)}
          </p>
          {showPerSqft ? (
            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
              {`₹${property.pricePerSqft!.toLocaleString('en-IN')}/sqft`}
            </p>
          ) : (
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              {property.status === 'rent' ? 'rental price' : 'onwards'}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <RippleButton
            onClick={handleActionClick}
            className="min-h-[44px] flex-1 rounded-xl bg-gold py-2.5 text-sm font-bold uppercase tracking-[0.05em] text-white transition-all hover:bg-primary-dark"
          >
            Enquire
          </RippleButton>
          <RippleButton
            onClick={handleActionClick}
            className="min-h-[44px] flex-shrink-0 rounded-xl border border-charcoal/20 px-4 py-2.5 text-sm font-bold uppercase tracking-[0.05em] text-charcoal transition-colors hover:border-charcoal/40 hover:bg-charcoal/5"
          >
            Book Visit
          </RippleButton>
        </div>
      </div>
      </div>
    </motion.article>
  );
};
