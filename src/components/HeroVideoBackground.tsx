import React, { useEffect, useRef, useState } from 'react';

import loop3 from '../assets/loop3.mp4';
import loop1 from '../assets/loop1.mp4';
import loop2 from '../assets/loop2.mp4';
import heroPoster from '../assets/first_page_image.png';
import heroPosterMobile from '../assets/mobile_view.jpg';

const CLIPS = [loop3, loop1, loop2];

const CLIP_MS = 6500;
const CROSSFADE_MS = 1200;

interface HeroVideoBackgroundProps {
  staticOnly?: boolean;
}

export const HeroVideoBackground: React.FC<HeroVideoBackgroundProps> = ({ staticOnly = false }) => {
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([0, 1 % CLIPS.length]));
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const next = (active + 1) % CLIPS.length;

  useEffect(() => {
    if (staticOnly) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % CLIPS.length);
    }, CLIP_MS);
    return () => window.clearInterval(id);
  }, [staticOnly]);

  useEffect(() => {
    if (staticOnly) return;
    setMounted((prev) => {
      if (prev.has(active) && prev.has(next)) return prev;
      const updated = new Set(prev);
      updated.add(active);
      updated.add(next);
      return updated;
    });
    const el = videoRefs.current[active];
    if (el) {
      el.currentTime = 0;
      const playPromise = el.play();
      if (playPromise) playPromise.catch(() => {});
    }
  }, [active, next, staticOnly]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Poster fallback — a dedicated portrait-friendly image on small
          screens (where staticOnly is true and this is all that's shown,
          since videos don't render there), the video poster on everything
          wider. Same sm: breakpoint (640px) the staticHero/smallScreen check
          in HomePage.tsx already uses. */}
      <img
        src={heroPosterMobile}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover sm:hidden"
      />
      <img
        src={heroPoster}
        alt=""
        aria-hidden
        className="absolute inset-0 hidden h-full w-full object-cover sm:block"
      />

      {!staticOnly &&
        CLIPS.map((src, i) => (
          <video
            key={src}
            ref={(el) => { videoRefs.current[i] = el; }}
            className="absolute inset-0 h-full w-full object-cover transition-opacity ease-in-out"
            style={{
              opacity: i === active ? 1 : 0,
              transitionDuration: `${CROSSFADE_MS}ms`,
            }}
            src={mounted.has(i) ? src : undefined}
            poster={heroPoster}
            muted
            loop
            autoPlay
            playsInline
            preload={i === active || i === next ? 'auto' : 'metadata'}
            tabIndex={-1}
          />
        ))}

      {/* Primary gradient scrim — significantly darkened vs before so text
          stays legible over bright daylight footage on the right side.
          Middle is no longer near-transparent (was 0.08) — now 0.42+. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,16,12,0.55) 0%, rgba(10,16,12,0.42) 30%, rgba(10,16,12,0.48) 60%, rgba(10,16,12,0.65) 100%)',
        }}
      />

      {/* Radial vignette — darkens bright edges (especially the washed-out
          right side visible in some clips) without touching the centre where
          the text and search bar sit. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 80% at 40% 45%, transparent 30%, rgba(10,16,12,0.55) 100%)',
        }}
      />

      {/* Per-clip progress indicator — dark pill backdrop keeps contrast
          against bright daylight footage where a plain white/40 track washes out. */}
      {!staticOnly && (
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-2 backdrop-blur-sm sm:bottom-5 sm:right-6">
          {CLIPS.map((src, i) => (
            <span
              key={src}
              className="h-1.5 w-8 overflow-hidden rounded-full bg-white/50 sm:w-10"
            >
              <span
                className="block h-full rounded-full bg-brass-light transition-all ease-linear"
                style={{
                  width: i === active ? '100%' : '0%',
                  transitionDuration: i === active ? `${CLIP_MS}ms` : '300ms',
                }}
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
};