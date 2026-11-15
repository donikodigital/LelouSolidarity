//web/components/ui/Toast.tsx
// v1.0 — notification flottante (succès / erreur), toujours visible en haut de l'écran,
// même quand la page est défilée (le bouton « Générer la carte » est en bas sur mobile).
// Se ferme toute seule (barre de progression), peut porter un lien d'action
// (ex. « Télécharger le PDF ») et respecte la zone sûre des téléphones (encoche).
'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { AlertCircle, CheckCircle2, Download, X } from 'lucide-react';
import { useT } from '@/lib/i18n/I18nProvider';

export interface ToastData {
  /** Change à chaque nouvelle notification : relance l'animation et le minuteur. */
  id: number;
  type: 'success' | 'error';
  message: string;
  /** Lien facultatif affiché sous le message (ex. télécharger le PDF). */
  action?: { label: string; href: string };
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

// Durée d'affichage : les erreurs restent plus longtemps pour être lues
const DURATION_MS: Record<ToastData['type'], number> = {
  success: 6000,
  error: 9000,
};

const styles: Record<ToastData['type'], { icon: string; bar: string }> = {
  success: { icon: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500' },
  error: { icon: 'bg-red-50 text-red-600', bar: 'bg-red-500' },
};

export function Toast({ toast, onClose }: ToastProps) {
  const t = useT();
  const [running, setRunning] = useState(false);

  // onClose peut changer à chaque rendu de la page : on le garde dans une ref
  // pour ne pas relancer le minuteur à chaque fois.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const id = toast?.id;
  const type = toast?.type;

  useEffect(() => {
    if (id === undefined || !type) return;

    // La barre de progression part de 100 % puis se vide pendant toute la durée
    setRunning(false);
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setRunning(true));
    });
    const timer = window.setTimeout(() => closeRef.current(), DURATION_MS[type]);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [id, type]);

  if (!toast || typeof document === 'undefined') return null;

  const isError = toast.type === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;
  const style = styles[toast.type];

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div
        key={toast.id}
        role={isError ? 'alert' : 'status'}
        aria-live={isError ? 'assertive' : 'polite'}
        className="animate-pop-down pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-ocean-100/60 bg-white shadow-card-hover"
      >
        <div className="flex items-start gap-3 p-4 pr-3">
          <span
            className={clsx(
              'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
              style.icon,
            )}
          >
            <Icon className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1 pt-1">
            <p className="break-words text-sm font-semibold leading-snug text-ocean-800">
              {toast.message}
            </p>
            {toast.action && (
              <a
                href={toast.action.href}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-ocean-50 px-3 py-1.5 text-sm font-semibold text-ocean-700 hover:bg-ocean-100"
              >
                <Download className="h-4 w-4" />
                {toast.action.label}
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="flex-shrink-0 rounded-full p-1.5 text-ocean-300 hover:bg-ocean-50 hover:text-ocean-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Barre de progression : se vide jusqu'à la fermeture automatique */}
        <div className="h-1 w-full bg-ocean-50" aria-hidden="true">
          <div
            className={clsx('h-full origin-left', style.bar)}
            style={{
              transform: running ? 'scaleX(0)' : 'scaleX(1)',
              transition: running ? `transform ${DURATION_MS[toast.type]}ms linear` : 'none',
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
