//web/components/admin/DeleteMemberModal.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/components/admin/SessionProvider';
import { apiAdmin, ApiError } from '@/lib/api';
import { Member } from '@/lib/types';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { fmt } from '@/lib/i18n/pair';

interface DeleteMemberModalProps {
  open: boolean;
  member: Member;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteMemberModal({ open, member, onClose, onDeleted }: DeleteMemberModalProps) {
  const { session } = useSession();
  const { t } = useI18n();
  const td = t.admin.delete;
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  const handleClose = useCallback(() => {
    if (!deleting) onClose();
  }, [deleting, onClose]);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await apiAdmin(`/admin/members/${member.id}`, session.accessToken, {
        method: 'DELETE',
      });
      // La page redirige vers la liste : on laisse le bouton en chargement
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : td.failed);
      setDeleting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={td.title}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <p className="text-sm leading-relaxed text-ocean-600">
            {fmt(td.intro, { name: '\u0000' })
              .split('\u0000')
              .flatMap((part, i, arr) =>
                i < arr.length - 1
                  ? [
                      part,
                      <strong key="name" className="font-semibold text-ocean-800">
                        {member.firstName} {member.lastName}
                      </strong>,
                    ]
                  : [part],
              )}
          </p>
        </div>

        <ul className="list-disc space-y-1.5 pl-5 text-sm text-ocean-500">
          {td.bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <p className="text-sm font-semibold text-red-600">{td.irreversible}</p>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-1 grid grid-cols-2 gap-2.5 sm:flex sm:justify-end">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={deleting}>
            {td.cancel}
          </Button>
          <Button type="button" variant="danger-solid" onClick={handleDelete} loading={deleting}>
            {deleting ? td.deleting : td.confirm}
          </Button>
        </div>
      </div>
    </Modal>
  );
}