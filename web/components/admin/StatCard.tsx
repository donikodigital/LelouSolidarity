//web/components/admin/StatCard.tsx
// v1.1 — carte moderne : pastille dégradée, décor lumineux, animation au survol
// (soulèvement) et au toucher, compteur animé ; peut être cliquable (href).
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, LucideIcon } from 'lucide-react';
import clsx from 'clsx';

type Tone = 'ocean' | 'amber' | 'emerald' | 'red' | 'slate';

const tones: Record<Tone, { tile: string; glow: string }> = {
  ocean: { tile: 'from-ocean-400 to-ocean-600 shadow-ocean-600/30', glow: 'bg-ocean-300/25' },
  amber: { tile: 'from-amber-400 to-amber-500 shadow-amber-500/30', glow: 'bg-amber-300/25' },
  emerald: { tile: 'from-emerald-400 to-emerald-600 shadow-emerald-600/30', glow: 'bg-emerald-300/25' },
  red: { tile: 'from-red-400 to-red-600 shadow-red-600/30', glow: 'bg-red-300/25' },
  slate: { tile: 'from-slate-400 to-slate-600 shadow-slate-600/30', glow: 'bg-slate-300/25' },
};

/** Fait monter le nombre de 0 à `value` (court, désactivé si l'utilisateur réduit les animations). */
function useCountUp(value: number, duration = 700) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || value === 0) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return display;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'ocean',
  href,
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone?: Tone;
  /** Si fourni, la carte devient un lien. */
  href?: string;
  /** Décalage (ms) de l'animation d'apparition, pour un effet en cascade. */
  delay?: number;
}) {
  const count = useCountUp(value);
  const { tile, glow } = tones[tone];

  const content = (
    <>
      <span
        className={clsx(
          'pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl transition-transform duration-500 group-hover:scale-125',
          glow,
        )}
      />
      <div className="relative flex items-start justify-between">
        <span
          className={clsx(
            'flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110',
            tile,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        {href && (
          <ArrowUpRight className="h-4 w-4 text-ocean-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ocean-600" />
        )}
      </div>
      <div className="relative mt-4">
        <p className="text-3xl font-extrabold leading-none tracking-tight text-ocean-800">{count}</p>
        <p className="mt-1.5 text-xs font-semibold leading-snug text-ocean-400">{label}</p>
      </div>
    </>
  );

  const classes =
    'animate-rise group relative block min-w-0 overflow-hidden rounded-xl2 border border-ocean-100/60 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover active:scale-[0.97] sm:p-5';

  return href ? (
    <Link href={href} className={classes} style={{ animationDelay: `${delay}ms` }}>
      {content}
    </Link>
  ) : (
    <div className={classes} style={{ animationDelay: `${delay}ms` }}>
      {content}
    </div>
  );
}