//web/components/admin/NotificationsProvider.tsx
'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { apiAdmin } from '@/lib/api';
import { AppNotification, buildNotifications } from '@/lib/notifications';
import { FormRequest, Member } from '@/lib/types';
import { useSession } from './SessionProvider';

const REFRESH_MS = 60_000;

interface AdminDataValue {
  members: Member[] | null;
  requests: FormRequest[] | null;
  /** true uniquement pendant le tout premier chargement */
  loading: boolean;
  error: string | null;
  notifications: AppNotification[];
  unreadCount: number;
  /** Date (ms) de la dernière notification vue : au-delà, une notification est « non lue ». */
  seenAt: number;
  /** Nombre de demandes de formulaire à traiter (pastille de la barre du bas). */
  requestsToHandle: number;
  refresh: () => Promise<void>;
  markAllRead: () => void;
}

const AdminDataContext = createContext<AdminDataValue | null>(null);

/**
 * Charge une seule fois les membres et les demandes de formulaire pour tout
 * l'espace admin, les rafraîchit (toutes les minutes, au retour sur l'onglet et
 * à chaque changement de page) et en déduit les notifications.
 * L'état « lu / non lu » est mémorisé sur l'appareil (localStorage).
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const pathname = usePathname();
  const token = session.accessToken;
  const storageKey = `ls-notifications-seen:${session.admin.id}`;

  const [members, setMembers] = useState<Member[] | null>(null);
  const [requests, setRequests] = useState<FormRequest[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seenAt, setSeenAt] = useState(0);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setSeenAt(Number(raw) || 0);
    } catch {
      /* stockage indisponible : tout apparaîtra comme non lu */
    }
  }, [storageKey]);

  const refresh = useCallback(async () => {
    try {
      // Chargés séparément : si les demandes de formulaire sont indisponibles
      // (ex. backend pas encore à jour), les membres s'affichent quand même.
      const [m, r] = await Promise.allSettled([
        apiAdmin('/admin/members', token),
        apiAdmin('/admin/form-requests', token),
      ]);
      if (m.status === 'fulfilled') {
        setMembers(m.value);
        setError(null);
      } else {
        setError('Impossible de charger la liste des membres.');
      }
      if (r.status === 'fulfilled') setRequests(r.value);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // À chaque changement de page (et au premier affichage)
  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  // Toutes les minutes, et quand on revient sur l'application
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, REFRESH_MS);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  const notifications = useMemo(
    () => buildNotifications(members || [], requests || []),
    [members, requests],
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => Date.parse(n.date) > seenAt).length,
    [notifications, seenAt],
  );

  const requestsToHandle = useMemo(
    () => (requests || []).filter((r) => !r.handled).length,
    [requests],
  );

  const markAllRead = useCallback(() => {
    // On se cale sur la date de la notification la plus récente (horloge du
    // serveur) plutôt que sur l'heure du téléphone, qui peut être décalée.
    const latest = notifications.reduce((max, n) => Math.max(max, Date.parse(n.date)), seenAt);
    setSeenAt(latest);
    try {
      window.localStorage.setItem(storageKey, String(latest));
    } catch {
      /* stockage indisponible : on ignore */
    }
  }, [notifications, seenAt, storageKey]);

  return (
    <AdminDataContext.Provider
      value={{
        members,
        requests,
        loading,
        error,
        notifications,
        unreadCount,
        seenAt,
        requestsToHandle,
        refresh,
        markAllRead,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData doit être utilisé dans NotificationsProvider');
  return ctx;
}