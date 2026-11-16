//web/components/pwa/InstallBanner.tsx
// v1.0 — suggestion d'installation de l'application, affichée dans l'espace administrateur.
//  - apparaît quelques secondes après l'ouverture, au-dessus de la barre de navigation du bas ;
//  - Android / ordinateur : bouton « Installer » (fenêtre du navigateur) ;
//  - iPhone / iPad : bouton « Comment faire ? » (guide en 3 étapes) ;
//  - « Plus tard » ou la croix : on ne la repropose pas avant 7 jours (l'entrée « Application »
//    du profil reste disponible à tout moment) ;
//  - jamais affichée si l'application est déjà installée.
'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, Share, X } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { InstallGuideSheet } from './InstallGuideSheet';
import { useInstall } from './InstallProvider';
import { useT } from '@/lib/i18n/I18nProvider';

const SNOOZE_KEY = 'ls-install-snoozed-until';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 3500;
const DONE_VISIBLE_MS = 2500;

function isSnoozed(): boolean {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY) || 0) > Date.now();
  } catch {
    return false;
  }
}

function snooze() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
  } catch {
    /* stockage indisponible : la bannière reviendra à la prochaine visite */
  }
}

export function InstallBanner() {
  const t = useT().install;
  const { available, canPrompt, isIos, promptInstall } = useInstall();

  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);
  // Fenêtre d'installation du navigateur ouverte : le bouton reste affiché (en attente)
  const [installing, setInstalling] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  // Une fois fermée (ou installée), la bannière ne revient pas pendant cette visite
  const closed = useRef(false);

  // Apparition différée : on ne saute pas à la figure de l'administrateur dès l'ouverture
  useEffect(() => {
    if (!available || visible || closed.current || isSnoozed()) return;
    const timer = window.setTimeout(() => {
      if (!closed.current) setVisible(true);
    }, SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [available, visible]);

  function dismiss() {
    closed.current = true;
    snooze();
    setVisible(false);
  }

  async function handleInstall() {
    setInstalling(true);
    const outcome = await promptInstall();
    setInstalling(false);
    if (outcome === 'accepted') {
      closed.current = true;
      setDone(true);
      window.setTimeout(() => {
        setVisible(false);
        setDone(false);
      }, DONE_VISIBLE_MS);
    } else {
      // Refusé dans la fenêtre du navigateur : inutile d'insister avant quelques jours
      dismiss();
    }
  }

  if (!visible) {
    return <InstallGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />;
  }

  return (
    <>
      {/* Mobile : au-dessus de la barre du bas ; grand écran : coin inférieur droit */}
      <div
        data-hide-on-keyboard
        className="pointer-events-none fixed inset-x-0 bottom-[calc(6.75rem+env(safe-area-inset-bottom))] z-40 px-3 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-[25rem] lg:px-0"
      >
        <div
          role="dialog"
          aria-label={t.bannerTitle}
          className="animate-rise pointer-events-auto relative mx-auto max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-ocean-800 via-ocean-700 to-ocean-600 p-4 text-white shadow-[0_14px_40px_rgba(6,34,52,0.45)] ring-1 ring-white/10 lg:max-w-none"
        >
          {/* Reflet décoratif */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#D8B65C]/20 blur-2xl"
          />

          {!done && (
            <button
              type="button"
              onClick={dismiss}
              aria-label={t.later}
              className="absolute right-2.5 top-2.5 rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {done ? (
            <div role="status" className="animate-pop-in flex items-center gap-3 py-1">
              <CheckCircle2 className="h-9 w-9 flex-shrink-0 text-emerald-300" />
              <p className="text-base font-extrabold">{t.done}</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 pr-7">
                <Logo size={48} className="flex-shrink-0 ring-2 ring-[#D8B65C]" />
                <div className="min-w-0">
                  <h2 className="text-[15px] font-extrabold leading-tight">{t.bannerTitle}</h2>
                  <p className="mt-1 text-[13px] leading-snug text-ocean-100/85">{t.bannerText}</p>
                </div>
              </div>

              <div className="mt-3.5 flex gap-2.5">
                {canPrompt || installing ? (
                  <button
                    type="button"
                    onClick={handleInstall}
                    disabled={installing}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#D8B65C] px-4 py-2.5 text-sm font-extrabold text-ocean-900 shadow-md shadow-black/20 transition hover:bg-[#e3c46f] active:scale-[0.97] disabled:opacity-70"
                  >
                    <Download className="h-4 w-4 animate-bounce" />
                    {t.install}
                  </button>
                ) : (
                  isIos && (
                    <button
                      type="button"
                      onClick={() => setGuideOpen(true)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#D8B65C] px-4 py-2.5 text-sm font-extrabold text-ocean-900 shadow-md shadow-black/20 transition hover:bg-[#e3c46f] active:scale-[0.97]"
                    >
                      <Share className="h-4 w-4" />
                      {t.howTo}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/15 active:scale-[0.97]"
                >
                  {t.later}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <InstallGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
