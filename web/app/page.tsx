//web/app/page.tsx
// v1.3 — bouton « Installer l'application » (PWA) sous le bouton de demande de formulaire.
// v1.2 — langues FR/EN : sélecteur en haut à gauche (pastille style OCCAZ).
// v1.1 — logo, bouton « Espace administrateur » en haut à droite, bouton
// « Demander votre formulaire d'adhésion » (modal) à la place de l'ancien
// bouton « Remplir le formulaire » (le formulaire arrive désormais par e-mail).
import Link from 'next/link';
import { Mail, ClipboardCheck, IdCard, Send, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { RequestFormButton } from '@/components/forms/RequestFormButton';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { InstallButton } from '@/components/pwa/InstallButton';
import { ASSOCIATION_NAME } from '@/lib/constants';
import { fmt } from '@/lib/i18n/pair';
import { getT } from '@/lib/i18n/server';

const STEP_ICONS = [Send, ClipboardCheck, IdCard];

export default async function HomePage() {
  const { t } = await getT();
  return (
    <main className="flex min-h-screen flex-col">
      <section className="relative overflow-hidden bg-gradient-to-br from-ocean-700 via-ocean-600 to-ocean-500 px-6 pb-24 pt-28 text-white sm:pb-32 sm:pt-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Langue : en haut à gauche */}
        <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
          <LanguageSwitcher align="left" />
        </div>

        {/* Espace administrateur : en haut à droite */}
        <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <ShieldCheck className="h-4 w-4" />
            {t.home.adminSpace}
          </Link>
        </div>

        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <Logo
            size={120}
            priority
            className="ring-4 ring-[#D8B65C]/90 shadow-2xl shadow-black/30"
          />
          <h1 className="mt-7 text-4xl font-extrabold tracking-tight sm:text-5xl">
            {ASSOCIATION_NAME}
          </h1>
          <p className="mt-4 max-w-xl text-base text-ocean-100 sm:text-lg">
            {t.common.associationTagline}
          </p>
          <p className="mt-2 max-w-xl text-sm text-ocean-100/90 sm:text-base">
            {t.home.intro}
          </p>

          <RequestFormButton />

          <p className="mt-3 flex items-center gap-1.5 text-xs text-ocean-100/70">
            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
            {t.home.emailNote}
          </p>

          {/* N'apparaît que si le navigateur peut installer l'application et qu'elle ne l'est pas déjà */}
          <InstallButton className="mt-6" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 sm:py-20">
        <h2 className="text-center text-2xl font-bold text-ocean-800">{t.home.howItWorks}</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3 [&>*]:min-w-0">
          {t.home.steps.map((step, i) => {
            const Icon = STEP_ICONS[i];
            return (
            <div
              key={step.title}
              className="rounded-xl2 border border-ocean-100 bg-white p-6 shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ocean-50 text-ocean-600">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-ocean-300">{fmt(t.home.step, { n: i + 1 })}</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-ocean-800">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ocean-500">{step.description}</p>
            </div>
            );
          })}
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}