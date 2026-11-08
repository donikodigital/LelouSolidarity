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
import { useI18n } from '@/lib/i18n/I18nProvider';
import { fmt } from '@/lib/i18n/pair';

interface AccessCodeModalProps {
  record: AccessCodeRecord | null;
  open: boolean;
  onClose: () => void;
  /** Appelé après une modification ou une suppression réussie, pour rafraîchir la liste. */
  onChanged: () => void;
}

type Mode = 'view' | 'edit' | 'confirm-delete';

export function AccessCodeModal({ record, open, onClose, onChanged }: AccessCodeModalProps) {
  const { session } = useSession();
  const { t, locale } = useI18n();
  const tc = t.admin.codes;
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
      setError(err instanceof ApiError ? err.message : tc.updateFailed);
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
      setError(err instanceof ApiError ? err.message : tc.deleteFailed);
      setDeleting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={tc.modalTitle}>
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> <span className="min-w-0">{error}</span>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-ocean-50 px-2.5 py-1 text-xs font-semibold tracking-widest text-ocean-600">
            {record.code}
          </span>
          <span
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              record.used ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {record.used ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
            {record.used ? tc.used : tc.pending}
          </span>
        </div>

        {mode === 'edit' ? (
          <Input
            label={tc.memberEmail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        ) : (
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-ocean-400">{tc.emailLabel}</p>
            <p className="break-all text-sm font-semibold text-ocean-800">{record.email}</p>
          </div>
        )}

        <p className="text-xs text-ocean-400">{fmt(tc.sentOn, { date: formatDate(record.createdAt, locale) })}</p>

        {record.used && record.member && (
          <p className="text-xs text-ocean-400">
            {tc.usedByLong}{' '}
            <span className="font-medium text-ocean-600">
              {record.member.firstName} {record.member.lastName}
            </span>
          </p>
        )}

        {!canEdit && mode === 'view' && (
          <p className="text-xs text-ocean-400">
            {tc.locked}
          </p>
        )}
      </div>

      {mode === 'view' && (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" disabled={!canEdit} onClick={() => setMode('edit')}>
            <Pencil className="h-4 w-4" /> {tc.edit}
          </Button>
          <Button variant="danger" size="sm" disabled={!canEdit} onClick={() => setMode('confirm-delete')}>
            <Trash2 className="h-4 w-4" /> {tc.remove}
          </Button>
        </div>
      )}

      {mode === 'edit' && (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setMode('view')} disabled={saving}>
            {tc.cancel}
          </Button>
          <Button size="sm" loading={saving} onClick={handleSave}>
            {tc.save}
          </Button>
        </div>
      )}

      {mode === 'confirm-delete' && (
        <div className="flex flex-col gap-3 rounded-xl bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            {tc.confirmDelete}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setMode('view')} disabled={deleting}>
              {tc.cancel}
            </Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
              {tc.yesDelete}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}