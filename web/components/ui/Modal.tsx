//web/components/ui/Modal.tsx
// v1.1 — clavier du téléphone : la modale se cale sur la zone visible (.kb-viewport) et se compacte
// (marges, padding, titre) tant que le clavier est ouvert ; le bouton « Fermer » reste visible
// pendant le défilement sans prendre de place (zone collée de hauteur nulle).
'use client';

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Card } from './Card';
import { useT } from '@/lib/i18n/I18nProvider';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Largeur maximale : 'md' (defaut) ou 'lg' pour les formulaires. */
  size?: 'md' | 'lg';
}

const sizes: Record<NonNullable<ModalProps['size']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const t = useT();
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="kb-viewport fixed inset-0 z-50 flex items-center justify-center p-4 kb:p-1.5">
      <div className="absolute inset-0 bg-ocean-900/40" onClick={onClose} aria-hidden="true" />
      {/* max-h + overflow : sur mobile, un long formulaire reste accessible en defilant.
          kb: = clavier ouvert, on gagne de la place (marges et padding réduits). */}
      <Card
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 w-full ${sizes[size]} max-h-full overflow-y-auto overscroll-contain p-5 shadow-card-hover sm:p-6 kb:rounded-2xl kb:p-3.5`}
      >
        {/* Zone collée en haut du défilement, hauteur nulle : le bouton reste atteignable
            même quand le titre est sorti de l'écran (clavier ouvert, long formulaire). */}
        <div className="sticky top-3 z-20 h-0">
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="absolute -right-1 -top-1 rounded-full bg-white/90 p-1.5 text-ocean-400 shadow-sm ring-1 ring-ocean-100 backdrop-blur-sm hover:bg-ocean-50 hover:text-ocean-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {title && <h2 className="mb-5 pr-9 text-lg font-bold text-ocean-800 kb:mb-3 kb:text-base">{title}</h2>}
        {children}
      </Card>
    </div>,
    document.body,
  );
}
