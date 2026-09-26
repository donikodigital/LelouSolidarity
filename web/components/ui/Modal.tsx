//web/components/ui/Modal.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Card } from './Card';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ocean-900/40" onClick={onClose} aria-hidden="true" />
      <Card className="relative z-10 w-full max-w-md p-6 shadow-card-hover">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 rounded-lg p-1 text-ocean-400 hover:bg-ocean-50 hover:text-ocean-700"
        >
          <X className="h-4 w-4" />
        </button>
        {title && <h2 className="mb-5 pr-8 text-lg font-bold text-ocean-800">{title}</h2>}
        {children}
      </Card>
    </div>,
    document.body,
  );
}