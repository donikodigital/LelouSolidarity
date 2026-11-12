//web/components/admin/ProfileSheet.tsx
// v1.1 — menu rapide du gérant (ouvert depuis le logo de l'en-tête mobile) : photo, nom,
// accès à la page « Mon profil » et déconnexion.
'use client';

import Link from 'next/link';
import { LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { ASSOCIATION_NAME } from '@/lib/constants';
import { profileCompletion } from '@/lib/profile';
import { Avatar } from './Avatar';
import { useSession } from './SessionProvider';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { fmt } from '@/lib/i18n/pair';

export function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { session, logout } = useSession();
  const { admin } = session;
  const { t } = useI18n();
  const { percent } = profileCompletion(admin);

  return (
    <Sheet open={open} onClose={onClose} title={t.admin.profile.title}>
      <div className="flex flex-col items-center gap-3 pb-1 pt-2 text-center">
        <Avatar name={admin.name} email={admin.email} src={admin.avatarUrl} size={88} ring />
        <div className="min-w-0 max-w-full">
          <p className="break-words text-lg font-extrabold tracking-tight text-ocean-800">
            {admin.name?.trim() || t.admin.account.manager}
          </p>
          <p className="mt-0.5 break-all text-sm text-ocean-500">{admin.email}</p>
        </div>
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-ocean-50 px-3 py-1 text-xs font-semibold text-ocean-700">
          <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{fmt(t.admin.profile.role, { name: ASSOCIATION_NAME })}</span>
        </span>
        {percent < 100 && (
          <Link
            href="/admin/profil"
            onClick={onClose}
            className="text-xs font-semibold text-[#9A7B2F] underline-offset-2 hover:underline"
          >
            {fmt(t.admin.dashboard.completeProfile, { percent })}
          </Link>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Link
          href="/admin/profil"
          onClick={onClose}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ocean-500 px-6 py-3 text-base font-semibold text-white shadow-sm shadow-ocean-900/10 transition-colors hover:bg-ocean-600"
        >
          <UserRound className="h-4 w-4" />
          {t.admin.profile.view}
        </Link>
        <Button variant="danger" size="lg" className="w-full" onClick={logout}>
          <LogOut className="h-4 w-4" />
          {t.admin.nav.logout}
        </Button>
        <Button variant="ghost" className="w-full" onClick={onClose}>
          {t.common.close}
        </Button>
      </div>
    </Sheet>
  );
}
