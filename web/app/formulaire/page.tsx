//web/app/formulaire/page.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MemberForm } from '@/components/forms/MemberForm';
import { BrandMark } from '@/components/layout/BrandMark';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { ASSOCIATION_NAME } from '@/lib/constants';

export const metadata = {
  title: `Formulaire d'adhesion - ${ASSOCIATION_NAME}`,
};

export default function FormulairePage() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-ocean-50 to-white">
      <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ocean-500 hover:text-ocean-700"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>

        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark onDark={false} />
          <h1 className="mt-4 text-2xl font-bold text-ocean-800 sm:text-3xl">
            Formulaire d&apos;adhesion
          </h1>
          <p className="mt-2 max-w-md text-sm text-ocean-500">
            Renseignez vos informations et votre photo d&apos;identite. Votre carte de
            membre vous sera envoyee par e-mail des qu&apos;elle sera generee.
          </p>
        </div>

        <MemberForm />
      </div>
      <PublicFooter />
    </main>
  );
}
