//web/components/layout/LanguageSwitcher.tsx
// Sélecteur de langue en « pastille » (inspiré d'OCCAZ) : drapeau + code + chevron,
// avec un petit menu déroulant. Drapeaux en SVG (les emojis-drapeaux ne s'affichent pas sous Windows).
'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { LOCALES, LOCALE_META, type Locale } from '@/lib/i18n/config';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function Flag({ locale, className }: { locale: Locale; className?: string }) {
  const id = `flag-clip-${locale}`;
  return (
    <svg
      viewBox="0 0 24 16"
      className={clsx('h-4 w-6 flex-shrink-0 rounded-[3px] shadow-[0_0_0_1px_rgba(0,0,0,0.12)]', className)}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={id}>
          <rect width="24" height="16" rx="2.5" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {locale === 'fr' ? (
          <>
            <rect width="8" height="16" fill="#0055A4" />
            <rect x="8" width="8" height="16" fill="#FFFFFF" />
            <rect x="16" width="8" height="16" fill="#EF4135" />
          </>
        ) : locale === 'ff' ? (
          // Pular : drapeau de la Guinée (rouge, jaune, vert)
          <>
            <rect width="8" height="16" fill="#CE1126" />
            <rect x="8" width="8" height="16" fill="#FCD116" />
            <rect x="16" width="8" height="16" fill="#009460" />
          </>
        ) : (
          <>
            <rect width="24" height="16" fill="#FFFFFF" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <rect key={i} y={i * 2 * (16 / 13)} width="24" height={16 / 13} fill="#B22234" />
            ))}
            <rect width="11" height="8.6" fill="#3C3B6E" />
            {[
              [2, 1.8],
              [5, 1.8],
              [8, 1.8],
              [3.5, 4.2],
              [6.5, 4.2],
              [2, 6.6],
              [5, 6.6],
              [8, 6.6],
            ].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="0.6" fill="#FFFFFF" />
            ))}
          </>
        )}
      </g>
    </svg>
  );
}

export function LanguageSwitcher({
  className,
  align = 'left',
  onChange,
}: {
  className?: string;
  align?: 'left' | 'right';
  /** Appelé après un changement de langue (l'espace admin y enregistre le choix du gérant). */
  onChange?: (next: Locale) => void;
}) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={clsx('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.common.chooseLanguage}
        className="inline-flex items-center gap-2 rounded-full bg-white py-1.5 pl-2.5 pr-2 text-sm font-bold text-ocean-800 shadow-md shadow-black/15 transition active:scale-95 hover:shadow-lg"
      >
        <Flag locale={locale} />
        <span>{LOCALE_META[locale].short}</span>
        <ChevronDown className={clsx('h-4 w-4 text-ocean-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t.common.language}
          className={clsx(
            'animate-fade-in absolute top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl bg-white p-1 text-left shadow-2xl ring-1 ring-black/5',
            align === 'left' ? 'left-0' : 'right-0',
          )}
        >
          {LOCALES.map((code) => (
            <li key={code} role="option" aria-selected={code === locale}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (code !== locale) {
                    setLocale(code);
                    onChange?.(code);
                  }
                }}
                className={clsx(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                  code === locale ? 'bg-ocean-50 text-ocean-800' : 'text-ocean-700 hover:bg-ocean-50/70',
                )}
              >
                <Flag locale={code} />
                <span className="flex-1 text-left">{LOCALE_META[code].label}</span>
                {code === locale && <Check className="h-4 w-4 text-ocean-600" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
