//web/app/verify/[token]/page.tsx
// v1.5 — la ligne « Localité » affiche la localité d'origine (comme la carte) et non la ville
// d'origine ; repli sur la ville d'origine pour les membres sans localité enregistrée.
// v1.4 — textes et dates en FR/EN (langue du visiteur : cookie « lang » ou langue du navigateur).
// v1.4 — libellés de la carte : Localité, Résidence, Poste (plus de « localité d'origine »).
// v1.3 — libellés alignés sur la carte : Ville d'origine, Localité d'origine, Ville de résidence.
// v1.2 — affiche la photo du membre (cadre or) au-dessus du statut, pour que la
// personne qui contrôle compare le visage du porteur avec la photo enregistrée.
// v1.1 — la page ne dit plus « Carte introuvable » quand le serveur est
// simplement injoignable (hébergement en veille, trop de requêtes, panne) :
// seul un vrai 404 du serveur signifie « introuvable ». Dans les autres cas,
// un message « vérification indisponible » avec un bouton Réessayer s'affiche,
// pour qu'une carte valide ne passe jamais pour fausse. Accents rétablis.
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, WifiOff } from 'lucide-react';
import { BrandMark } from '@/components/layout/BrandMark';
import { Card } from '@/components/ui/Card';
import { MemberPhoto } from '@/components/ui/MemberPhoto';
import { formatDate } from '@/lib/format';
import { ASSOCIATION_NAME } from '@/lib/constants';
import { positionText } from '@/lib/positions';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { fmt } from '@/lib/i18n/pair';
import { getT } from '@/lib/i18n/server';
import { VerifyResult, CardStatus } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Laisse le temps à un serveur en veille de se réveiller, sans bloquer la page indéfiniment.
export const maxDuration = 30;
const FETCH_TIMEOUT_MS = 25_000;

// L'API renvoie aussi l'adresse de la photo (absente si le membre n'en a pas)
type VerifyWithPhoto = VerifyResult & {
  photoUrl?: string | null;
  photoFallbackUrl?: string | null;
};

type Lookup =
  | { kind: 'found'; result: VerifyWithPhoto }
  | { kind: 'not_found' }
  | { kind: 'unavailable' };

async function fetchVerification(token: string): Promise<Lookup> {
  try {
    const res = await fetch(`${API_URL}/public/verify/${encodeURIComponent(token)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.status === 404) return { kind: 'not_found' };
    // 429 (trop de requêtes), 5xx, 502 (serveur en veille ou en redémarrage)...
    if (!res.ok) return { kind: 'unavailable' };
    return { kind: 'found', result: (await res.json()) as VerifyWithPhoto };
  } catch {
    // Serveur injoignable ou délai dépassé
    return { kind: 'unavailable' };
  }
}

const statusConfig: Record<
  CardStatus,
  { icon: typeof CheckCircle2; bg: string; text: string }
> = {
  ACTIVE: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  EXPIRING_SOON: { icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-600' },
  EXPIRED: { icon: XCircle, bg: 'bg-red-50', text: 'text-red-600' },
  NONE: { icon: HelpCircle, bg: 'bg-slate-100', text: 'text-slate-500' },
};

// Next.js 15 : `params` est une promesse
export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lookup = await fetchVerification(token);
  const { t, locale } = await getT();

  return (
    <main className="relative flex min-h-screen flex-col items-center bg-gradient-to-b from-ocean-600 to-ocean-500 px-6 py-14">
      <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
        <LanguageSwitcher align="left" />
      </div>
      <div className="flex flex-col items-center text-white">
        <BrandMark />
        <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-ocean-100">
          {ASSOCIATION_NAME}
        </p>
        <h1 className="text-lg font-bold">{t.verify.title}</h1>
      </div>

      <Card className="mt-8 w-full max-w-md p-8">
        {lookup.kind === 'unavailable' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <WifiOff className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-ocean-800">{t.verify.unavailableTitle}</h2>
            <p className="text-sm text-ocean-500">
              {t.verify.unavailableText}
            </p>
            <a
              href={`/verify/${encodeURIComponent(token)}`}
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-ocean-700 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-ocean-800/25 transition hover:bg-ocean-800"
            >
              {t.verify.retry}
            </a>
          </div>
        )}

        {lookup.kind === 'not_found' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-ocean-800">{t.verify.notFoundTitle}</h2>
            <p className="text-sm text-ocean-500">
              {t.verify.notFoundText}
            </p>
          </div>
        )}

        {lookup.kind === 'found' && (
          <>
            {lookup.result.photoUrl && (
              <div className="mb-6 flex justify-center">
                <MemberPhoto
                  src={lookup.result.photoUrl}
                  fallbackSrc={lookup.result.photoFallbackUrl}
                  alt={fmt(t.verify.photoOf, { name: lookup.result.fullName })}
                />
              </div>
            )}

            {(() => {
              const cfg = statusConfig[lookup.result.status] ?? statusConfig.NONE;
              const Icon = cfg.icon;
              return (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full ${cfg.bg} ${cfg.text}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <h2 className={`text-lg font-bold ${cfg.text}`}>{t.verify.status[lookup.result.status] ?? t.verify.status.NONE}</h2>
                </div>
              );
            })()}

            <dl className="mt-8 flex flex-col divide-y divide-slate-100 text-sm">
              <Row label={t.verify.fullName} value={lookup.result.fullName} />
              <Row label={t.verify.memberCode} value={lookup.result.memberCode} />
              <Row
                label={t.verify.locality}
                value={lookup.result.originLocality?.trim() || lookup.result.originDistrict}
              />
              <Row label={t.verify.residence} value={lookup.result.residence} />
              <Row
                label={t.verify.position}
                value={positionText(t.admin.positions, lookup.result.position, lookup.result.positionOther)}
              />
              <Row label={t.verify.issuedOn} value={formatDate(lookup.result.issuedAt, locale)} />
              <Row label={t.verify.expiresOn} value={formatDate(lookup.result.expiresAt, locale)} />
            </dl>
          </>
        )}
      </Card>

      <p className="mt-6 max-w-sm text-center text-xs text-ocean-100/80">
        {fmt(t.verify.footer, { name: ASSOCIATION_NAME })}
      </p>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-ocean-400">{label}</dt>
      <dd className="font-semibold text-ocean-800">{value}</dd>
    </div>
  );
}