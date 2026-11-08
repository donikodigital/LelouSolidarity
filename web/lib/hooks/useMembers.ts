//web/lib/hooks/useMembers.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiAdmin } from '../api';
import { Member } from '../types';
import { useSession } from '@/components/admin/SessionProvider';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function useMembers() {
  const { session } = useSession();
  const { t } = useI18n();
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
      setError(t.admin.members.loadError);
    } finally {
      setLoading(false);
    }
  }, [session.accessToken, t]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { members, loading, error, reload };
}
