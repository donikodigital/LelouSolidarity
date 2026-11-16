//web/components/pwa/InstallGuideSheet.tsx
// Guide en 3 étapes pour ajouter l'application à l'écran d'accueil d'un iPhone / iPad
// (Safari n'a pas de bouton « Installer » : tout passe par le menu Partager).
'use client';

import { Check, PlusSquare, Share } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { useT } from '@/lib/i18n/I18nProvider';

export function InstallGuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT().install;

  const steps = [
    { icon: Share, title: t.step1, hint: t.step1Hint },
    { icon: PlusSquare, title: t.step2, hint: t.step2Hint },
    { icon: Check, title: t.step3, hint: t.step3Hint },
  ];

  return (
    <Sheet open={open} onClose={onClose} title={t.guideTitle}>
      <p className="text-sm leading-snug text-ocean-500">{t.guideIntro}</p>

      <ol className="mt-4 flex flex-col gap-3">
        {steps.map(({ icon: Icon, title, hint }, index) => (
          <li
            key={title}
            className="animate-rise flex items-start gap-3 rounded-2xl border border-ocean-100 bg-ocean-50/40 p-3.5"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <span className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-ocean-600 to-ocean-800 text-white shadow-md shadow-ocean-800/25">
              <Icon className="h-5 w-5" />
              <span className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#D8B65C] text-[11px] font-extrabold text-ocean-900 ring-2 ring-white">
                {index + 1}
              </span>
            </span>
            <span className="min-w-0 pt-0.5">
              <span className="block text-sm font-bold text-ocean-800">{title}</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-ocean-500">{hint}</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[13px] font-medium leading-snug text-amber-800">
        {t.guideNote}
      </p>

      <Button onClick={onClose} className="mt-4 w-full">
        {t.gotIt}
      </Button>
    </Sheet>
  );
}
