import Link from 'next/link';
import { Mail, ClipboardCheck, IdCard, ArrowRight } from 'lucide-react';
import { BrandMark } from '@/components/layout/BrandMark';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { ASSOCIATION_NAME, ASSOCIATION_TAGLINE } from '@/lib/constants';

const steps = [
  {
    icon: Mail,
    title: "Recevez votre code",
    description:
      "L'administrateur de l'association vous envoie un code d'acces personnel par e-mail.",
  },
  {
    icon: ClipboardCheck,
    title: 'Remplissez le formulaire',
    description:
      'Renseignez vos informations et televersez votre photo d\u2019identite, en quelques minutes.',
  },
  {
    icon: IdCard,
    title: 'Recevez votre carte',
    description:
      "Une fois validee par l'administrateur, votre carte de membre officielle vous est envoyee par e-mail.",
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <section className="relative overflow-hidden bg-gradient-to-br from-ocean-700 via-ocean-600 to-ocean-500 px-6 py-24 text-white sm:py-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <BrandMark size="lg" />
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
            {ASSOCIATION_NAME}
          </h1>
          <p className="mt-4 max-w-xl text-base text-ocean-100 sm:text-lg">
            {ASSOCIATION_TAGLINE}
          </p>
          <p className="mt-2 max-w-xl text-sm text-ocean-100/90 sm:text-base">
            Obtenez votre carte de membre officielle, au format carte bancaire,
            munie d&apos;un QR code de verification.
          </p>
          <Link
            href="/formulaire"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-ocean-700 shadow-lg shadow-ocean-900/20 transition-transform hover:scale-[1.02] hover:bg-ocean-50"
          >
            Remplir le formulaire d&apos;adhesion
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-xs text-ocean-100/70">
            Un code d&apos;acces, recu par e-mail, est necessaire pour soumettre le formulaire.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 sm:py-20">
        <h2 className="text-center text-2xl font-bold text-ocean-800">Comment ça marche</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-xl2 border border-ocean-100 bg-white p-6 shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ocean-50 text-ocean-600">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-ocean-300">
                  Etape {i + 1}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-ocean-800">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ocean-500">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
