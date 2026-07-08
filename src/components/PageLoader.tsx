import React, { useEffect, useMemo, useState } from 'react';
// Drop the icon-only / clean company emblem in here once uploaded, e.g.:
// import companyLogo from '../assets/logo-icon.png';
import companyLogo from '../assets/kmr-logo.svg';

interface PageLoaderProps {
  onDone?: () => void;
}

// Branded splash shown once on initial load. Rebuilt to match the client's
// real reference: a deep navy night skyline with water reflections, the
// gold/silver emblem glowing centered above the city, and the wordmark
// ("KMR" in silver, "Real Estates" in rose gold) below — the brand wordmark.
// Every layer (sky, stars, skyline, water, emblem, text) is built and
// animated independently in code rather than baked into one flat image.
// Purely timer-driven, so it can never hang even if the logo fails to load.
const HOLD_MS = 4000;
const FADE_MS = 500;

const STAR_COUNT = 40;
const PARTICLE_COUNT = 16;

interface Star {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

interface Particle {
  id: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  opacity: number;
}

interface Window {
  id: number;
  left: number;
  bottom: number;
  delay: number;
}

function makeStars(count: number): Star[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: Math.random() * 100,
    top: Math.random() * 55,
    size: 1 + Math.random() * 1.6,
    delay: Math.random() * 4,
    duration: 2 + Math.random() * 3,
  }));
}

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: 20 + Math.random() * 60,
    size: 1.5 + Math.random() * 3,
    delay: Math.random() * 3,
    duration: 5 + Math.random() * 4,
    drift: (Math.random() - 0.5) * 40,
    opacity: 0.25 + Math.random() * 0.35,
  }));
}

// Deterministic-feeling but varied window lights across the skyline.
function makeWindows(count: number, seedOffset: number): Window[] {
  return Array.from({ length: count }, (_, id) => ({
    id: id + seedOffset,
    left: Math.random() * 100,
    bottom: Math.random() * 70,
    delay: Math.random() * 3.5,
  }));
}

export const PageLoader: React.FC<PageLoaderProps> = ({ onDone }) => {
  const [leaving, setLeaving] = useState(false);
  const stars = useMemo(() => makeStars(STAR_COUNT), []);
  const particles = useMemo(() => makeParticles(PARTICLE_COUNT), []);
  const windowsFar = useMemo(() => makeWindows(26, 0), []);
  const windowsNear = useMemo(() => makeWindows(22, 100), []);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setLeaving(true), HOLD_MS);
    const doneTimer = window.setTimeout(() => onDone?.(), HOLD_MS + FADE_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden px-6 text-center transition-opacity ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        transitionDuration: `${FADE_MS}ms`,
        background: 'linear-gradient(180deg, #060814 0%, #0A0E1F 45%, #0D1226 75%, #060814 100%)',
      }}
      aria-hidden={leaving}
      role="status"
      aria-label="Loading KMR Real Estates"
    >
      {/* Twinkling starfield */}
      <div className="pointer-events-none absolute inset-0">
        {stars.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full bg-white animate-[twinkle_ease-in-out_infinite]"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animationDuration: `${s.duration}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Shooting star streak, echoing the one in the emblem */}
      <div className="pointer-events-none absolute left-[8%] top-[18%] h-px w-24 origin-left rotate-[18deg] bg-gradient-to-r from-transparent via-[#E3C1A3] to-transparent opacity-0 [animation:shootingStar_3.5s_ease-out_0.6s_1]" />

      {/* Ambient gold motes rising past the emblem */}
      <div className="pointer-events-none absolute inset-0">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full animate-[particleRise_linear_infinite]"
            style={{
              left: `${p.left}%`,
              bottom: '32%',
              width: p.size,
              height: p.size,
              opacity: 0,
              background: '#E3C1A3',
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              '--drift': `${p.drift}px`,
              '--peak-opacity': p.opacity,
              filter: 'blur(0.3px)',
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Breathing gold glow behind the emblem */}
      <div
        className="pointer-events-none absolute left-1/2 top-[30%] h-[90vmax] w-[90vmax] -translate-x-1/2 -translate-y-1/2 animate-[glowPulse_4.2s_ease-in-out_infinite] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(227,193,163,0.20) 0%, rgba(227,193,163,0.07) 32%, rgba(6,8,20,0) 62%)',
        }}
      />

      {/* Skyline — far layer (dimmer, smaller) */}
      <div className="pointer-events-none absolute bottom-[22%] left-0 right-0 h-28 opacity-60 [animation:fadeUp_1s_ease-out_forwards] sm:h-36">
        <Skyline windows={windowsFar} color="#141A30" heightScale={0.7} />
      </div>

      {/* Skyline — near layer */}
      <div className="pointer-events-none absolute bottom-[22%] left-0 right-0 h-32 [animation:fadeUp_1s_ease-out_0.15s_forwards] sm:h-44">
        <Skyline windows={windowsNear} color="#0B0E1C" heightScale={1} />
      </div>

      {/* Water reflection strip */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[22%] overflow-hidden">
        <div
          className="absolute inset-0 animate-[shimmerWater_5s_ease-in-out_infinite]"
          style={{
            background:
              'linear-gradient(180deg, rgba(227,193,163,0.10) 0%, rgba(10,14,30,0.6) 40%, #060814 100%)',
          }}
        />
      </div>

      {/* Emblem */}
      <img
        src={companyLogo}
        alt=""
        className="relative z-10 mx-auto h-28 w-28 object-contain opacity-0 [animation:emblemIn_1s_cubic-bezier(0.16,1,0.3,1)_0.3s_forwards,emblemFloat_3.4s_ease-in-out_1.3s_infinite] sm:h-36 sm:w-36"
      />

      {/* Wordmark — "KMR" silver, "Real Estates" rose gold */}
      <div className="relative z-10 mt-4 flex w-full items-baseline justify-center font-serif text-[2.4rem] leading-none tracking-tight sm:text-[3.2rem]">
        <span
          className="inline-block opacity-0 [animation:slideInLeft_0.7s_cubic-bezier(0.16,1,0.3,1)_1.1s_forwards]"
          style={{
            backgroundImage: 'linear-gradient(180deg, #F2F3F5 0%, #9CA1A8 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          KMR
        </span>
        <span
          className="ml-3 inline-block opacity-0 [animation:slideInRight_0.7s_cubic-bezier(0.16,1,0.3,1)_1.1s_forwards]"
          style={{
            backgroundImage: 'linear-gradient(180deg, #E3C1A3 0%, #A56B4A 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Real Estates
        </span>
      </div>

      <div className="relative z-10 mx-auto mt-3 h-px w-0 bg-[#E3C1A3]/50 [animation:drawLine_0.6s_ease-out_1.75s_forwards]" />

      <p className="relative z-10 mt-3 w-full text-center text-[0.65rem] font-medium uppercase tracking-[0.4em] text-[#D9B295] opacity-0 [animation:fadeUpText_0.6s_ease-out_1.9s_forwards] sm:text-xs">
        Real Estate Advisory
      </p>

      <p
        className="loader-address-line relative z-10 mt-3 opacity-0 [animation:fadeUpText_0.6s_ease-out_2.1s_forwards]"
      >
        Handpicked Homes for Rent &amp; Sale · Bengaluru
      </p>

      <p className="relative z-10 mt-4 w-full text-center font-serif text-base italic text-[#E3C1A3] opacity-0 [animation:fadeUpText_0.6s_ease-out_2.3s_forwards] sm:text-lg">
        Where your next address begins
      </p>

      {/* Progress bar with shimmer sweep */}
      <div className="relative z-10 mx-auto mt-9 h-0.5 w-32 overflow-hidden rounded-full bg-[#E3C1A3]/15">
        <div className="relative h-full w-full origin-left scale-x-0 bg-gradient-to-r from-[#E3C1A3] to-[#9C6B4E] [animation:loadBar_3.4s_ease-in-out_0.5s_forwards]">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent animate-[shimmerSweep_1.2s_ease-in-out_infinite]" />
        </div>
      </div>

      <style>{`
        .loader-address-line {
          width: 100% !important;
          max-width: 300px !important;
          margin-left: auto !important;
          margin-right: auto !important;
          text-align: center !important;
          font-size: 0.6rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.25em !important;
          color: #B08A6E !important;
        }
        @media (min-width: 640px) {
          .loader-address-line {
            font-size: 0.7rem !important;
          }
        }
        @keyframes emblemIn {
          0% { opacity: 0; transform: scale(1.5); filter: blur(12px); }
          60% { opacity: 1; transform: scale(0.95); filter: blur(0px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0px); }
        }
        @keyframes emblemFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes slideInLeft {
          0% { opacity: 0; transform: translateX(-28px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          0% { opacity: 0; transform: translateX(28px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes drawLine {
          0% { width: 0; }
          100% { width: 110px; }
        }
        @keyframes fadeUpText {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes loadBar {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.65; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes particleRise {
          0% { opacity: 0; transform: translate(0, 0); }
          15% { opacity: var(--peak-opacity); }
          85% { opacity: var(--peak-opacity); }
          100% { opacity: 0; transform: translate(var(--drift), -60vh); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.95; }
        }
        @keyframes shootingStar {
          0% { opacity: 0; transform: translateX(0) rotate(18deg); }
          8% { opacity: 1; }
          35% { opacity: 0; transform: translateX(160px) rotate(18deg); }
          100% { opacity: 0; }
        }
        @keyframes shimmerWater {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }
        @keyframes windowFlicker {
          0%, 100% { opacity: 0; }
          40% { opacity: 0; }
          50% { opacity: 0.9; }
          92% { opacity: 0.9; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>
    </div>
  );
};

// Simple procedural skyline made of varied-width/height rectangles plus a
// scattering of lit windows that flicker on at staggered delays.
const Skyline: React.FC<{ windows: Window[]; color: string; heightScale: number }> = ({
  windows,
  color,
  heightScale,
}) => {
  const buildings = useMemo(() => {
    const widths = [4, 6, 5, 8, 4, 7, 5, 9, 4, 6, 5, 7, 4, 8, 5, 6, 4, 7];
    let x = 0;
    return widths.map((w, i) => {
      const h = (20 + Math.sin(i * 1.7) * 15 + Math.random() * 25) * heightScale;
      const rect = { x, w, h };
      x += w + 0.4;
      return rect;
    });
  }, [heightScale]);

  const totalWidth = buildings.length ? buildings[buildings.length - 1].x + buildings[buildings.length - 1].w : 100;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} 30`}
      preserveAspectRatio="none"
      className="h-full w-full"
    >
      {buildings.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={30 - b.h / 4}
          width={b.w}
          height={b.h / 4}
          fill={color}
        />
      ))}
      {windows.map((win) => (
        <rect
          key={win.id}
          x={(win.left / 100) * totalWidth}
          y={29 - (win.bottom / 100) * 22}
          width={0.5}
          height={0.7}
          fill="#E3C1A3"
          opacity={0}
          style={{
            animation: `windowFlicker ${4 + (win.id % 5)}s ease-in-out ${win.delay}s infinite`,
          }}
        />
      ))}
    </svg>
  );
};
