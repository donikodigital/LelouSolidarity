//web/app/admin/(dashboard)/membres/[id]/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Download,
  IdCard,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CardStatusBadge, MemberStatusBadge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EditMemberModal } from '@/components/admin/EditMemberModal';
import { DeleteMemberModal } from '@/components/admin/DeleteMemberModal';
import { useSession } from '@/components/admin/SessionProvider';
import { apiAdmin, ApiError } from '@/lib/api';
import { formatDate, formatYear } from '@/lib/format';
import { Member } from '@/lib/types';

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { session } = useSession();

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiAdmin(`/admin/members/${id}`, session.accessToken);
      setMember(data);
    } catch {
      setError('Impossible de charger ce membre.');
    } finally {
      setLoading(false);
    }
  }, [id, session.accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await apiAdmin(`/admin/members/${id}/card/generate`, session.accessToken, {
        method: 'POST',
      });
      setMember(updated);
      setSuccessMsg('Carte generee et envoyee par e-mail au membre.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Echec de la generation de la carte.');
    } finally {
      setGenerating(false);
    }
  }

  function handleSaved(updated: Member, cardOutdated: boolean) {
    setMember(updated);
    setEditOpen(false);
    setError(null);
    setSuccessMsg(
      cardOutdated
        ? 'Informations mises a jour. Le PDF de la carte n\u2019est plus a jour : regenerez-la (le membre recevra un nouvel e-mail).'
        : 'Informations mises a jour.',
    );
    // Le message est en haut de page : sur mobile, on y ramene l'ecran
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDeleted() {
    router.replace('/admin/membres');
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        <AlertCircle className="h-4 w-4" /> {error || 'Membre introuvable.'}
      </div>
    );
  }

  const actionLabel =
    member.cardStatus === 'NONE'
      ? 'Generer la carte'
      : member.cardStatus === 'ACTIVE'
        ? 'Reimprimer la carte'
        : 'Renouveler la carte';

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => router.push('/admin/membres')}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ocean-500 hover:text-ocean-700"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux membres
      </button>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" /> {successMsg}
        </div>
      )}

      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <img
          src={member.photoUrl}
          alt={`${member.firstName} ${member.lastName}`}
          className="h-20 w-20 flex-shrink-0 rounded-full border border-ocean-100 object-cover"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-ocean-800">
            {member.firstName} {member.lastName}
          </h1>
          <p className="break-all text-sm text-ocean-400">{member.email}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <MemberStatusBadge status={member.status} />
            <CardStatusBadge status={member.cardStatus} />
            {member.memberCode && (
              <span className="rounded-full bg-ocean-50 px-2.5 py-1 text-xs font-semibold text-ocean-600">
                {member.memberCode}
              </span>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ocean-400">
            Informations personnelles
          </h2>
          <dl className="mt-4 flex flex-col divide-y divide-slate-100 text-sm">
            <Info label="Annee de naissance" value={formatYear(member.birthDate)} />
            <Info label="Origine" value={member.originDistrict} />
            <Info label="Adresse" value={member.addressLine} />
            <Info label="Ville" value={`${member.city}, ${member.state} ${member.zipCode}`} />
            <Info label="Telephone" value={member.phone} />
            <Info label="Demande recue le" value={formatDate(member.createdAt)} />
          </dl>

          {/* mt-auto : les boutons restent en bas de la carte, meme quand la
              carte voisine (Carte de membre) est plus haute */}
          <div className="mt-auto pt-6">
            <div className="flex gap-2.5 border-t border-slate-100 pt-5">
              <Button
                variant="secondary"
                onClick={() => setEditOpen(true)}
                className="flex-1"
              >
                <Pencil className="h-4 w-4" />
                Modifier
              </Button>
              <Button
                variant="danger"
                onClick={() => setDeleteOpen(true)}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ocean-400">
            Carte de membre
          </h2>

          {member.memberCode ? (
            <dl className="mt-4 flex flex-col divide-y divide-slate-100 text-sm">
              <Info label="Identifiant" value={member.memberCode} />
              <Info label="Emise le" value={formatDate(member.cardIssuedAt)} />
              <Info label="Expire le" value={formatDate(member.cardExpiresAt)} />
            </dl>
          ) : (
            <p className="mt-4 text-sm text-ocean-400">
              Aucune carte generee pour l&apos;instant.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Button onClick={handleGenerate} loading={generating} className="flex-1">
              <IdCard className="h-4 w-4" />
              {generating ? 'Generation...' : actionLabel}
            </Button>
            {member.cardPdfUrl && (
              <a
                href={member.cardPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1"
              >
                <Button variant="secondary" className="w-full">
                  <Download className="h-4 w-4" />
                  Telecharger le PDF
                </Button>
              </a>
            )}
          </div>

          {member.cardStatus === 'ACTIVE' && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ocean-400">
              <RefreshCw className="h-3.5 w-3.5 flex-shrink-0" />
              Reimprimer conserve la meme date d&apos;expiration (utile en cas de correction).
            </p>
          )}
          {(member.cardStatus === 'EXPIRING_SOON' || member.cardStatus === 'EXPIRED') && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ocean-400">
              <RefreshCw className="h-3.5 w-3.5 flex-shrink-0" />
              Le renouvellement relance une nouvelle periode de validite d&apos;un an.
            </p>
          )}
        </Card>
      </div>

      <EditMemberModal
        open={editOpen}
        member={member}
        onClose={() => setEditOpen(false)}
        onSaved={handleSaved}
      />
      <DeleteMemberModal
        open={deleteOpen}
        member={member}
        onClose={() => setDeleteOpen(false)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="flex-shrink-0 text-ocean-400">{label}</dt>
      <dd className="min-w-0 break-words text-right font-semibold text-ocean-800">{value}</dd>
    </div>
  );
}