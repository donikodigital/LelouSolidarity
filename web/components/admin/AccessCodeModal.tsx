//web/components/admin/AccessCodeModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/components/admin/SessionProvider';
import { apiAdmin, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { AccessCodeRecord } from '@/lib/types';

interface AccessCodeModalProps {
  record: AccessCodeRecord | null;
  open: boolean;
  onClose: () => void;
  /** Appele apres une modification ou une suppression reussie, pour rafraichir la liste. */
  onChanged: () => void;
}

type Mode = 'view' | 'edit' | 'confirm-delete';

export function AccessCodeModal({ record, open, onClose, onChanged }: AccessCodeModalProps) {
  const { session } = useSession();
  const [mode, setMode] = useState<Mode>('view');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && record) {
      setMode('view');
      setEmail(record.email);
      setError(null);
    }
  }, [open, record]);

  if (!record) return null;

  const canEdit = !record.used;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await apiAdmin(`/admin/access-codes/${record!.id}`, session.accessToken, {
        method: 'PATCH',
        body: JSON.stringify({ email }),
      });
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Echec de la mise a jour.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await apiAdmin(`/admin/access-codes/${record!.id}`, session.accessToken, {
        method: 'DELETE',
      });
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Echec de la suppression.");
      setDeleting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Code d'acces">
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-ocean-50 px-2.5 py-1 text-xs font-semibold tracking-widest text-ocean-600">
            {record.code}
          </span>
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              record.used ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {record.used ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
            {record.used ? 'Utilise' : 'En attente'}
          </span>
        </div>

        {mode === 'edit' ? (
          <Input
            label="Adresse e-mail du membre"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        ) : (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ocean-400">Adresse e-mail</p>
            <p className="text-sm font-semibold text-ocean-800">{record.email}</p>
          </div>
        )}

        <p className="text-xs text-ocean-400">Envoye le {formatDate(record.createdAt)}</p>

        {record.used && record.member && (
          <p className="text-xs text-ocean-400">
            Utilise par{' '}
            <span className="font-medium text-ocean-600">
              {record.member.firstName} {record.member.lastName}
            </span>
          </p>
        )}

        {!canEdit && mode === 'view' && (
          <p className="text-xs text-ocean-400">
            Ce code a deja ete utilise par un membre : il ne peut plus etre modifie ni supprime.
          </p>
        )}
      </div>

      {mode === 'view' && (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" disabled={!canEdit} onClick={() => setMode('edit')}>
            <Pencil className="h-4 w-4" /> Modifier
          </Button>
          <Button variant="danger" size="sm" disabled={!canEdit} onClick={() => setMode('confirm-delete')}>
            <Trash2 className="h-4 w-4" /> Supprimer
          </Button>
        </div>
      )}

      {mode === 'edit' && (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setMode('view')} disabled={saving}>
            Annuler
          </Button>
          <Button size="sm" loading={saving} onClick={handleSave}>
            Enregistrer
          </Button>
        </div>
      )}

      {mode === 'confirm-delete' && (
        <div className="flex flex-col gap-3 rounded-xl bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            Supprimer definitivement ce code d&apos;acces ? Cette action est irreversible.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setMode('view')} disabled={deleting}>
              Annuler
            </Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
              Oui, supprimer
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}