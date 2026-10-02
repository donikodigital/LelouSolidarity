//web/components/ui/Sheet.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Panneau qui monte du bas de l'écran sur mobile (« bottom sheet ») et
 * s'affiche en pop-up en haut à droite sur grand écran.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
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
    <div className="fixed inset-0 z-50">
      <div
        className="animate-fade-in absolute inset-0 bg-ocean-900/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet-up absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-16 sm:max-h-[calc(100dvh-5rem)] sm:w-[24rem] sm:rounded-2xl sm:pb-0"
      >
        {/* Poignée (mobile) */}
        <div className="mx-auto mt-2.5 h-1.5 w-10 flex-shrink-0 rounded-full bg-slate-200 sm:hidden" />

        <div className="flex flex-shrink-0 items-center justify-between gap-3 px-5 pb-3 pt-4">
          <h2 className="text-lg font-extrabold tracking-tight text-ocean-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1.5 text-ocean-400 transition hover:bg-ocean-50 hover:text-ocean-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}