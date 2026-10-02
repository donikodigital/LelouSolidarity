//web/components/admin/ProfileSheet.tsx
'use client';

import { LogOut, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { ASSOCIATION_NAME } from '@/lib/constants';
import { useSession } from './SessionProvider';

export function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { session, logout } = useSession();
  const { admin } = session;

  return (
    <Sheet open={open} onClose={onClose} title="Mon profil">
      <div className="flex flex-col items-center gap-3 pb-1 pt-2 text-center">
        <Logo size={88} ring />
        <div className="min-w-0 max-w-full">
          <p className="break-words text-lg font-extrabold tracking-tight text-ocean-800">
            {admin.name || 'Administrateur'}
          </p>
          <p className="mt-0.5 break-all text-sm text-ocean-500">{admin.email}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ocean-50 px-3 py-1 text-xs font-semibold text-ocean-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          Administrateur · {ASSOCIATION_NAME}
        </span>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Button variant="danger-solid" size="lg" className="w-full" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </Button>
        <Button variant="ghost" className="w-full" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </Sheet>
  );
}