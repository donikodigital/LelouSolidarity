//web/lib/hooks/useFormRequests.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiAdmin } from '../api';
import { FormRequest } from '../types';
import { useSession } from '@/components/admin/SessionProvider';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function useFormRequests() {
  const { session } = useSession();
  const { t } = useI18n();
  const [requests, setRequests] = useState<FormRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiAdmin('/admin/form-requests', session.accessToken);
      setRequests(data);
    } catch {
      setError(t.admin.requests.loadError);
    } finally {
      setLoading(false);
    }
  }, [session.accessToken, t]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { requests, loading, error, reload };
}