//web/app/formulaire/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MemberForm } from '@/components/forms/MemberForm';
import { Logo } from '@/components/layout/Logo';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { ASSOCIATION_NAME } from '@/lib/constants';

export const metadata = {
  title: `Formulaire d’adhésion - ${ASSOCIATION_NAME}`,
};

const STEPS = [
  'Remplissez le formulaire',
  'L’administrateur valide',
  'Recevez votre carte par e-mail',
];

export default function FormulairePage() {
  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-ocean-50 via-white to-white">
      {/* Halos décoratifs en arrière-plan */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-ocean-300/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/3 -z-10 h-64 w-64 rounded-full bg-[#D8B65C]/15 blur-3xl"
      />

      <div className="mx-auto w-full max-w-3xl px-3 py-8 sm:px-6 sm:py-14">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-sm font-medium text-ocean-500 transition hover:text-ocean-700 sm:mb-6 sm:px-0"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <div className="mb-8 flex flex-col items-center px-2 text-center sm:mb-10">
          <Logo size={88} ring priority />
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.28em] text-[#9A7B2F]">
            {ASSOCIATION_NAME}
          </p>
          <h1 className="mt-2 bg-gradient-to-r from-ocean-800 to-ocean-600 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
            Formulaire d&apos;adhésion
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ocean-500">
            Renseignez vos informations et votre photo d&apos;identité. Votre carte de
            membre vous sera envoyée par e-mail dès qu&apos;elle sera générée.
          </p>

          <ol className="mt-6 grid w-full max-w-md grid-cols-3 gap-2">
            {STEPS.map((label, i) => (
              <li key={label} className="flex flex-col items-center gap-1.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#F3E2A9] via-[#D8B65C] to-[#9A7B2F] text-xs font-bold text-ocean-900 shadow-sm">
                  {i + 1}
                </span>
                <span className="text-[11px] font-medium leading-tight text-ocean-600 sm:text-xs">
                  {label}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Suspense est requis car MemberForm lit le code d'accès dans l'adresse (?code=...) */}
        <Suspense fallback={null}>
          <MemberForm />
        </Suspense>
      </div>
      <PublicFooter />
    </main>
  );
}