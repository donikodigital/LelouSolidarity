'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSession } from '@/lib/types';
import { getSession, clearSession } from '@/lib/auth';
import { Spinner } from '@/components/ui/Spinner';

interface SessionContextValue {
  session: AdminSession;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null | undefined>(undefined);

  useEffect(() => {
    const existing = getSession();
    if (!existing) {
      router.replace('/admin/login');
      return;
    }
    setSession(existing);
  }, [router]);

  function logout() {
    clearSession();
    router.replace('/admin/login');
  }

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ocean-50">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (session === null) {
    return null;
  }

  return (
    <SessionContext.Provider value={{ session, logout }}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession doit etre utilise dans SessionProvider');
  return ctx;
}
