//web/components/admin/ProfileSheet.tsx
'use client';

import { LogOut, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { ASSOCIATION_NAME } from '@/lib/constants';
import { useSession } from './SessionProvider';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { fmt } from '@/lib/i18n/pair';

export function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { session, logout } = useSession();
  const { admin } = session;
  const { t } = useI18n();

  return (
    <Sheet open={open} onClose={onClose} title={t.admin.profile.title}>
      <div className="flex flex-col items-center gap-3 pb-1 pt-2 text-center">
        <Logo size={88} ring />
        <div className="min-w-0 max-w-full">
          <p className="break-words text-lg font-extrabold tracking-tight text-ocean-800">
            {admin.name || t.admin.administrator}
          </p>
          <p className="mt-0.5 break-all text-sm text-ocean-500">{admin.email}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ocean-50 px-3 py-1 text-xs font-semibold text-ocean-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          {fmt(t.admin.profile.role, { name: ASSOCIATION_NAME })}
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Button variant="danger-solid" size="lg" className="w-full" onClick={logout}>
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