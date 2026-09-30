//web/components/admin/DeleteMemberModal.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/components/admin/SessionProvider';
import { apiAdmin, ApiError } from '@/lib/api';
import { Member } from '@/lib/types';

interface DeleteMemberModalProps {
  open: boolean;
  member: Member;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteMemberModal({ open, member, onClose, onDeleted }: DeleteMemberModalProps) {
  const { session } = useSession();
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
      setError(
        err instanceof ApiError ? err.message : 'Impossible de supprimer ce membre, reessayez.',
      );
      setDeleting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Supprimer ce membre ?">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <p className="text-sm leading-relaxed text-ocean-600">
            Vous allez supprimer definitivement{' '}
            <strong className="font-semibold text-ocean-800">
              {member.firstName} {member.lastName}
            </strong>
            .
          </p>
        </div>

        <ul className="list-disc space-y-1.5 pl-5 text-sm text-ocean-500">
          <li>La fiche et la photo du membre sont effacees.</li>
          <li>Sa carte PDF est supprimee et son QR code ne sera plus valide.</li>
          <li>Son code d&apos;acces est supprime avec lui.</li>
        </ul>

        <p className="text-sm font-semibold text-red-600">Cette action est irreversible.</p>

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
            Annuler
          </Button>
          <Button type="button" variant="danger-solid" onClick={handleDelete} loading={deleting}>
            {deleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}