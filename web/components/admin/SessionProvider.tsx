//web/components/admin/SessionProvider.tsx
// v1.2 — la déconnexion remet la langue par défaut (la langue appartient au gérant, pas à l'appareil).
// v1.1 — le profil du gérant (nom, photo...) est rechargé en silence à l'ouverture,
// et updateAdmin() permet aux pages de le mettre à jour (et de remplacer le jeton
// quand le serveur en émet un nouveau : changement de mot de passe, d'e-mail...).
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { AdminProfile, AdminSession } from '@/lib/types';
import { getSession, saveSession, clearSession } from '@/lib/auth';
import { apiAdmin } from '@/lib/api';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';
import { Spinner } from '@/components/ui/Spinner';

interface SessionContextValue {
  session: AdminSession;
  logout: () => void;
  /**
   * Met à jour le profil affiché partout (en-tête, menu, accueil) et l'enregistre
   * dans le navigateur. Si le serveur a émis un nouveau jeton, il le remplace ici :
   * sans cela, la prochaine requête serait refusée et le gérant déconnecté.
   */
  updateAdmin: (patch: Partial<AdminProfile>, accessToken?: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { setLocale } = useI18n();
  const [session, setSession] = useState<AdminSession | null | undefined>(undefined);
  const latest = useRef<AdminSession | null>(null);

  const commit = useCallback((next: AdminSession) => {
    latest.current = next;
    saveSession(next);
    setSession(next);
  }, []);

  const updateAdmin = useCallback(
    (patch: Partial<AdminProfile>, accessToken?: string) => {
      const current = latest.current;
      if (!current) return;
      commit({
        accessToken: accessToken ?? current.accessToken,
        admin: { ...current.admin, ...patch },
      });
    },
    [commit],
  );

  useEffect(() => {
    const existing = getSession();
    if (!existing) {
      router.replace('/admin/login');
      return;
    }
    latest.current = existing;
    setSession(existing);

    // Recharge le profil complet. En cas de réponse 401 (session révoquée), apiAdmin
    // renvoie déjà vers la connexion ; toute autre erreur est ignorée (réseau coupé).
    apiAdmin('/admin/profile', existing.accessToken)
      .then((profile: AdminProfile | null) => {
        if (profile) updateAdmin(profile);
      })
      .catch(() => {});
  }, [router, updateAdmin]);

  function logout() {
    // clearSession() remet aussi le cookie de langue au français ; setLocale() aligne l'affichage
    // en cours : la personne suivante sur cet appareil ne garde pas la langue de la précédente.
    clearSession();
    setLocale(DEFAULT_LOCALE);
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
    <SessionContext.Provider value={{ session, logout, updateAdmin }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
