import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { BrandMark } from '@/components/layout/BrandMark';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/format';
import { ASSOCIATION_NAME } from '@/lib/constants';
import { VerifyResult, CardStatus } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function fetchVerification(token: string): Promise<VerifyResult | null> {
  try {
    const res = await fetch(`${API_URL}/public/verify/${token}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
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
    label: 'A renouveler prochainement',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
  },
  EXPIRED: {
    icon: XCircle,
    label: 'Carte expiree',
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
  const result = await fetchVerification(params.token);

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-ocean-600 to-ocean-500 px-6 py-14">
      <div className="flex flex-col items-center text-white">
        <BrandMark />
        <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-ocean-100">
          {ASSOCIATION_NAME}
        </p>
        <h1 className="text-lg font-bold">Verification de carte de membre</h1>
      </div>

      <Card className="mt-8 w-full max-w-md p-8">
        {!result ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-ocean-800">Carte introuvable</h2>
            <p className="text-sm text-ocean-500">
              Ce QR code ne correspond a aucune carte de membre connue.
            </p>
          </div>
        ) : (
          <>
            {(() => {
              const cfg = statusConfig[result.status];
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
              <Row label="Nom complet" value={result.fullName} />
              <Row label="Identifiant" value={result.memberCode} />
              <Row label="Origine" value={result.originDistrict} />
              <Row label="Residence" value={result.residence} />
              <Row label="Emise le" value={formatDate(result.issuedAt)} />
              <Row label="Expire le" value={formatDate(result.expiresAt)} />
            </dl>
          </>
        )}
      </Card>

      <p className="mt-6 max-w-sm text-center text-xs text-ocean-100/80">
        Ce statut est verifie en temps reel aupres de {ASSOCIATION_NAME}.
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
