//web/app/admin/(dashboard)/demandes/page.tsx
'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Inbox,
  Mail,
  MapPin,
  Phone,
  Send,
  Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useSession } from '@/components/admin/SessionProvider';
import { useFormRequests } from '@/lib/hooks/useFormRequests';
import { useAdminData } from '@/components/admin/NotificationsProvider';
import { apiAdmin, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { FormRequest } from '@/lib/types';

type FilterKey = 'TODO' | 'DONE' | 'ALL';

const filters: { key: FilterKey; label: string }[] = [
  { key: 'TODO', label: 'À traiter' },
  { key: 'DONE', label: 'Traitées' },
  { key: 'ALL', label: 'Toutes' },
];

type Mode = 'view' | 'confirm-send' | 'confirm-delete';
type Action = 'send' | 'handled' | 'delete';

function RequestCard({
  request,
  onChanged,
}: {
  request: FormRequest;
  onChanged: (notice?: string) => void;
}) {
  const { session } = useSession();
  const [mode, setMode] = useState<Mode>('view');
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: Action) {
    setBusy(action);
    setError(null);
    try {
      const base = `/admin/form-requests/${request.id}`;
      if (action === 'send') {
        await apiAdmin(`${base}/send-form`, session.accessToken, { method: 'POST' });
      } else if (action === 'handled') {
        await apiAdmin(`${base}/handled`, session.accessToken, { method: 'PATCH' });
      } else {
        await apiAdmin(base, session.accessToken, { method: 'DELETE' });
      }
      setMode('view');
      onChanged(action === 'send' ? `Formulaire envoyé à ${request.email}.` : undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action impossible, merci de réessayer.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
      {/* En-tête : nom, statut, date */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words text-base font-bold text-ocean-800">
            {request.firstName} {request.lastName.toUpperCase()}
          </p>
          <p className="text-xs text-ocean-400">Reçue le {formatDate(request.createdAt)}</p>
        </div>
        <span
          className={clsx(
            'flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
            request.handled ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
          )}
        >
          {request.handled ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Clock3 className="h-3.5 w-3.5" />
          )}
          {request.handled ? 'Traitée' : 'À traiter'}
        </span>
      </div>

      {/* Message du membre */}
      <p className="rounded-xl border-l-4 border-[#D8B65C] bg-ocean-50/70 px-3.5 py-2.5 text-sm leading-relaxed text-ocean-700">
        {request.message}
      </p>

      {/* Coordonnées */}
      <ul className="flex flex-col gap-2 text-sm text-ocean-700">
        <li className="flex items-center gap-2.5">
          <MapPin className="h-4 w-4 flex-shrink-0 text-ocean-400" />
          <span className="min-w-0 break-words">{request.city}</span>
        </li>
        <li className="flex items-center gap-2.5">
          <Mail className="h-4 w-4 flex-shrink-0 text-ocean-400" />
          <a href={`mailto:${request.email}`} className="min-w-0 break-all font-medium hover:underline">
            {request.email}
          </a>
        </li>
        <li className="flex items-center gap-2.5">
          <Phone className="h-4 w-4 flex-shrink-0 text-ocean-400" />
          <a href={`tel:${request.phone}`} className="min-w-0 break-all font-medium hover:underline">
            {request.phone}
          </a>
        </li>
      </ul>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="min-w-0">{error}</span>
        </div>
      )}

      {/* Actions */}
      {mode === 'view' && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setMode('confirm-send')} disabled={busy !== null}>
            <Send className="h-4 w-4" />
            {request.handled ? 'Renvoyer le formulaire' : 'Envoyer le formulaire'}
          </Button>
          {!request.handled && (
            <Button
              size="sm"
              variant="secondary"
              loading={busy === 'handled'}
              disabled={busy !== null}
              onClick={() => run('handled')}
            >
              <CheckCircle2 className="h-4 w-4" /> Marquer comme traitée
            </Button>
          )}
          <Button
            size="sm"
            variant="danger"
            disabled={busy !== null}
            onClick={() => setMode('confirm-delete')}
          >
            <Trash2 className="h-4 w-4" /> Supprimer
          </Button>
        </div>
      )}

      {mode === 'confirm-send' && (
        <div className="flex flex-col gap-3 rounded-xl bg-ocean-50 p-4">
          <p className="break-words text-sm font-medium text-ocean-700">
            Envoyer un lien d&apos;accès au formulaire à{' '}
            <span className="font-bold">{request.email}</span> ?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" disabled={busy !== null} onClick={() => setMode('view')}>
              Annuler
            </Button>
            <Button size="sm" loading={busy === 'send'} onClick={() => run('send')}>
              Oui, envoyer
            </Button>
          </div>
        </div>
      )}

      {mode === 'confirm-delete' && (
        <div className="flex flex-col gap-3 rounded-xl bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            Supprimer définitivement cette demande ? Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" disabled={busy !== null} onClick={() => setMode('view')}>
              Annuler
            </Button>
            <Button
              variant="danger-solid"
              size="sm"
              loading={busy === 'delete'}
              onClick={() => run('delete')}
            >
              Oui, supprimer
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function DemandesPage() {
  const { requests, loading, error, reload } = useFormRequests();
  const { refresh } = useAdminData(); // met à jour les pastilles (barre du bas, cloche)
  const [active, setActive] = useState<FilterKey>('TODO');
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      (requests || []).filter((r) =>
        active === 'ALL' ? true : active === 'TODO' ? !r.handled : r.handled,
      ),
    [requests, active],
  );

  function handleChanged(message?: string) {
    setNotice(message ?? null);
    reload();
    refresh();
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ocean-800 sm:text-3xl">
          Demandes de formulaire
        </h1>
        <p className="mt-1 text-sm text-ocean-400">
          Demandes envoyées par les futurs membres depuis la page d&apos;accueil.
        </p>
      </div>

      <div
        role="group"
        aria-label="Filtrer les demandes"
        className="grid grid-cols-3 gap-1.5 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200"
      >
        {filters.map((f) => {
          const isActive = active === f.key;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActive(f.key)}
              className={clsx(
                'rounded-xl px-2 py-2.5 text-center text-[13px] font-semibold leading-tight transition-all sm:text-sm',
                isActive
                  ? 'bg-ocean-700 text-white shadow-md shadow-ocean-800/25'
                  : 'text-ocean-600 hover:bg-ocean-50',
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span className="min-w-0 break-words">{notice}</span>
        </div>
      )}

      {loading && !requests && (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {requests && !error && filtered.length === 0 && (
        <EmptyState
          icon={<Inbox className="h-8 w-8" />}
          title={active === 'TODO' ? 'Aucune demande à traiter' : 'Aucune demande dans cette catégorie'}
          description="Les demandes envoyées depuis la page d’accueil apparaîtront ici."
        />
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 [&>*]:min-w-0">
          {filtered.map((request) => (
            <RequestCard key={request.id} request={request} onChanged={handleChanged} />
          ))}
        </div>
      )}
    </div>
  );
}