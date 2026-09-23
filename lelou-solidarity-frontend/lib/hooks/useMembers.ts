'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiAdmin } from '../api';
import { Member } from '../types';
import { useSession } from '@/components/admin/SessionProvider';

export function useMembers() {
  const { session } = useSession();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiAdmin('/admin/members', session.accessToken);
      setMembers(data);
    } catch {
      setError('Impossible de charger la liste des membres.');
    } finally {
      setLoading(false);
    }
  }, [session.accessToken]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { members, loading, error, reload };
}
