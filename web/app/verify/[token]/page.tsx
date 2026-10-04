//web/app/verify/[token]/page.tsx
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
  { icon: typeof CheckCircle2; label: string; bg: string; text: string }
> = {
  ACTIVE: {
    icon: CheckCircle2,
    label: 'Carte active',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
  EXPIRING_SOON: {
    icon: AlertTriangle,
    label: 'À renouveler prochainement',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
  },
  EXPIRED: {
    icon: XCircle,
    label: 'Carte expirée',
    bg: 'bg-red-50',
    text: 'text-red-600',
  },
  NONE: {
    icon: HelpCircle,
    label: 'Aucune carte',
    bg: 'bg-slate-100',
    text: 'text-slate-500',
  },
};

export default async function VerifyPage({ params }: { params: { token: string } }) {
  const lookup = await fetchVerification(params.token);

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-ocean-600 to-ocean-500 px-6 py-14">
      <div className="flex flex-col items-center text-white">
        <BrandMark />
        <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-ocean-100">
          {ASSOCIATION_NAME}
        </p>
        <h1 className="text-lg font-bold">Vérification de carte de membre</h1>
      </div>

      <Card className="mt-8 w-full max-w-md p-8">
        {lookup.kind === 'unavailable' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <WifiOff className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-ocean-800">Vérification momentanément indisponible</h2>
            <p className="text-sm text-ocean-500">
              Le serveur est peut-être en train de démarrer. Patientez environ une minute puis
              réessayez. Cela ne signifie pas que la carte est invalide.
            </p>
            <a
              href={`/verify/${encodeURIComponent(params.token)}`}
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-ocean-700 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-ocean-800/25 transition hover:bg-ocean-800"
            >
              Réessayer
            </a>
          </div>
        )}

        {lookup.kind === 'not_found' && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-ocean-800">Carte introuvable</h2>
            <p className="text-sm text-ocean-500">
              Ce QR code ne correspond à aucune carte de membre connue.
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
                  alt={`Photo de ${lookup.result.fullName}`}
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
                  <h2 className={`text-lg font-bold ${cfg.text}`}>{cfg.label}</h2>
                </div>
              );
            })()}

            <dl className="mt-8 flex flex-col divide-y divide-slate-100 text-sm">
              <Row label="Nom complet" value={lookup.result.fullName} />
              <Row label="Identifiant" value={lookup.result.memberCode} />
              <Row label="Origine" value={lookup.result.originDistrict} />
              <Row label="Résidence" value={lookup.result.residence} />
              <Row label="Émise le" value={formatDate(lookup.result.issuedAt)} />
              <Row label="Expire le" value={formatDate(lookup.result.expiresAt)} />
            </dl>
          </>
        )}
      </Card>

      <p className="mt-6 max-w-sm text-center text-xs text-ocean-100/80">
        Ce statut est vérifié en temps réel auprès de {ASSOCIATION_NAME}.
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