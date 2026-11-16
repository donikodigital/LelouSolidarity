//web/components/admin/profile/InstallCard.tsx
// Entrée « Application » de la page profil : l'administrateur peut installer l'application à tout
// moment, même s'il a fermé la bannière (« Plus tard »).
'use client';

import { useState } from 'react';
import { CheckCircle2, Download, Info, Share, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InstallGuideSheet } from '@/components/pwa/InstallGuideSheet';
import { useInstall } from '@/components/pwa/InstallProvider';
import { Section } from './Section';
import { useT } from '@/lib/i18n/I18nProvider';

export function InstallCard({ delay }: { delay?: number }) {
  const t = useT().install;
  const { installed, canPrompt, isIos, promptInstall } = useInstall();
  const [guideOpen, setGuideOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleInstall() {
    setBusy(true);
    try {
      await promptInstall();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section icon={Smartphone} title={t.cardTitle} description={t.cardDescription} delay={delay}>
      {installed ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="min-w-0 break-words">{t.cardInstalled}</span>
        </div>
      ) : canPrompt ? (
        <Button onClick={handleInstall} loading={busy} className="w-full">
          <Download className="h-4 w-4" />
          {t.install}
        </Button>
      ) : isIos ? (
        <>
          <Button onClick={() => setGuideOpen(true)} className="w-full">
            <Share className="h-4 w-4" />
            {t.howTo}
          </Button>
          <InstallGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
        </>
      ) : (
        <p className="flex items-start gap-2 rounded-xl bg-ocean-50 px-3.5 py-2.5 text-[13px] leading-snug text-ocean-600">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="min-w-0">{t.cardMenuHint}</span>
        </p>
      )}
    </Section>
  );
}
