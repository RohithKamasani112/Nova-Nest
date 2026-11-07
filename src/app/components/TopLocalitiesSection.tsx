import React, { useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Property } from '../../types';
import { LOCALITY_IMAGES } from '../../data/localityImages';
import { getDistinctLocalities, localityKey, type LocalityGroup } from '../../utils/propertyLocalities';
import { toTitleCase } from '../../utils/format';

const LocalityCover: React.FC<{ locality: LocalityGroup }> = ({ locality }) => {
  const [failed, setFailed] = useState<string[]>([]);
  const photo = LOCALITY_IMAGES[localityKey(locality.name)] || LOCALITY_IMAGES.whitefield;
  const candidates = [...locality.coverImages, photo.src];
  const src = candidates.find(image => !failed.includes(image));
  return src ? <img
    src={src}
    alt={src === photo.src ? photo.alt : `A property in ${toTitleCase(locality.name)}`}
    title={src === photo.src ? `${photo.alt} - ${photo.author}, ${photo.license}` : undefined}
    onError={() => setFailed(current => current.includes(src) ? current : [...current, src])}
    loading="lazy"
    decoding="async"
    width={230}
    height={230}
    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
  /> : <div aria-hidden="true" className="h-full w-full bg-gradient-to-br from-primary to-gold/40" />;
};

interface TopLocalitiesSectionProps {
  properties: Property[];
  onSelectLocality: (locality: string) => void;
  // "navigate" (default): homepage discovery — clicking a card sends the
  // visitor to the pre-filtered listings page.
  // "filter": listings page — clicking a card toggles it as a live filter on
  // the same page (selected state shown via ring + checkmark), no separate
  // Apply step. `selected` drives which cards render as active.
  mode?: 'navigate' | 'filter';
  selected?: string[];
  title?: string;
}

export const TopLocalitiesSection: React.FC<TopLocalitiesSectionProps> = ({
  properties,
  onSelectLocality,
  mode = 'navigate',
  selected = [],
  title = 'Localities',
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const localities = useMemo(() => getDistinctLocalities(properties), [properties]);

  if (localities.length === 0) return null;

  const scrollBy = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: direction * 260, behavior: 'smooth' });
  };

  return (
    <section className="border-t border-charcoal/[0.07] bg-white">
      <div className="max-w-7xl mx-auto px-4 py-14 sm:px-6 lg:px-8 sm:py-20">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-[22px] font-bold text-charcoal">
            <span aria-hidden>🗺️</span>
            {title}
          </h2>
          <div className="flex flex-shrink-0 gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Scroll localities left"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-charcoal transition-colors hover:border-gold/50 hover:text-gold"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Scroll localities right"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-charcoal transition-colors hover:border-gold/50 hover:text-gold"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div ref={scrollerRef} className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {localities.map((locality) => {
            const isSelected = mode === 'filter' && selected.includes(locality.name);
            return (
              <button
                key={locality.name}
                type="button"
                onClick={() => onSelectLocality(locality.name)}
                aria-label={`${toTitleCase(locality.name)}: ${locality.count} active ${locality.count === 1 ? 'property' : 'properties'}`}
                aria-pressed={mode === 'filter' ? isSelected : undefined}
                className={`group relative h-[230px] w-[230px] flex-shrink-0 overflow-hidden rounded-xl transition-shadow ${
                  isSelected ? 'ring-4 ring-accent ring-offset-2' : ''
                }`}
              >
                <LocalityCover locality={locality} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                {isSelected && (
                  <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-charcoal shadow-md">
                    <Check size={16} strokeWidth={3} />
                  </span>
                )}
                <span className="absolute bottom-0 left-0 right-0 p-4 text-left text-lg font-bold text-white">
                  {toTitleCase(locality.name)}
                </span>
              </button>
            );
          })}
        </div>
        <details className="mt-3 text-xs text-muted-foreground">
          <summary className="w-fit cursor-pointer">Locality photo credits</summary>
          <p className="mt-2">Area photographs are used only when listing images are missing or unavailable. Images are scaled and cropped to fit the cards.</p>
          <ul className="mt-2 space-y-1">{Object.entries(LOCALITY_IMAGES).map(([name, photo]) => <li key={name}><a href={photo.source} target="_blank" rel="noopener noreferrer" className="underline">{toTitleCase(name)} - {photo.author}</a>{' '}(<a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">{photo.license}</a>)</li>)}</ul>
        </details>
      </div>
    </section>
  );
};
