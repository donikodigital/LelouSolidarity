//web/components/admin/profile/DataCard.tsx
// Export de la liste des membres en CSV (sauvegarde, comptabilité, courrier...).
'use client';

import { useState } from 'react';
import { Database, Download, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/components/admin/SessionProvider';
import { Notice, Section, type Flash } from './Section';
import { apiAdminBlob, ApiError } from '@/lib/api';
import { downloadBlob } from '@/lib/profile';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function DataCard({ delay }: { delay?: number }) {
  const { session } = useSession();
  const { t } = useI18n();
  const td = t.admin.account.data;

  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);

  async function exportMembers() {
    setBusy(true);
    setFlash(null);
    try {
      const blob = await apiAdminBlob('/admin/export/members', session.accessToken);
      const day = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `${td.fileName}-${day}.csv`);
      setFlash({ kind: 'success', text: td.done });
    } catch (err) {
      setFlash({ kind: 'error', text: err instanceof ApiError ? err.message : td.failed });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section icon={Database} title={td.title} description={td.description} delay={delay}>
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-snug text-ocean-600">{td.text}</p>
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium leading-snug text-amber-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {td.warning}
        </p>
        <Notice flash={flash} />
        <Button onClick={exportMembers} loading={busy} className="w-full">
          {!busy && <Download className="h-4 w-4" />}
          {busy ? td.exporting : td.export}
        </Button>
      </div>
    </Section>
  );
}
