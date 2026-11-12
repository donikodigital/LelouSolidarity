//web/components/admin/profile/Section.tsx
// Cadre commun des blocs de la page profil + message de retour (succès / erreur).
'use client';

import type { LucideIcon } from 'lucide-react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

export function Section({
  icon: Icon,
  title,
  description,
  delay = 0,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Délai d'apparition en ms (effet de cascade). */
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card
      className={clsx('animate-rise min-w-0 p-4 sm:p-5', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F3E2A9] via-[#D8B65C] to-[#9A7B2F] text-ocean-900 shadow-md shadow-[#9A7B2F]/25">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-extrabold tracking-tight text-ocean-800">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] leading-snug text-ocean-500">{description}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

export interface Flash {
  kind: 'success' | 'error';
  text: string;
}

export function Notice({ flash }: { flash: Flash | null }) {
  if (!flash) return null;
  const ok = flash.kind === 'success';
  return (
    <div
      role={ok ? 'status' : 'alert'}
      className={clsx(
        'animate-rise flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium',
        ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
      )}
    >
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      )}
      <span className="min-w-0 break-words">{flash.text}</span>
    </div>
  );
}
