//web/components/pwa/InstallButton.tsx
// v1.0 — bouton « Installer l'application » toujours visible sur la page d'accueil (fond bleu).
// Contrairement à la bannière, il ne disparaît pas après « Plus tard » : le visiteur peut installer
// l'application quand il veut. Il n'existe que si l'installation est possible (navigateur compatible
// et application pas encore installée) ; sinon il ne s'affiche tout simplement pas.
//  - Android / ordinateur : ouvre la fenêtre d'installation du navigateur ;
//  - iPhone / iPad : ouvre le guide « Ajouter à l'écran d'accueil ».
'use client';

import { useState } from 'react';
import { Download, Share } from 'lucide-react';
import { InstallGuideSheet } from './InstallGuideSheet';
import { useInstall } from './InstallProvider';
import { useT } from '@/lib/i18n/I18nProvider';

export function InstallButton({ className = '' }: { className?: string }) {
  const t = useT().install;
  const { available, canPrompt, isIos, promptInstall } = useInstall();
  const [guideOpen, setGuideOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!available) return null;

  async function handleClick() {
    if (canPrompt) {
      setBusy(true);
      try {
        await promptInstall();
      } finally {
        setBusy(false);
      }
    } else if (isIos) {
      setGuideOpen(true);
    }
  }

  const Icon = canPrompt ? Download : Share;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={`animate-rise inline-flex items-center justify-center gap-2 rounded-full border border-[#D8B65C]/70 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/10 backdrop-blur transition hover:bg-white/20 active:scale-[0.97] disabled:opacity-70 ${className}`}
      >
        <Icon className="h-4 w-4 text-[#D8B65C]" />
        {t.bannerTitle}
      </button>
      {isIos && <InstallGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />}
    </>
  );
}
