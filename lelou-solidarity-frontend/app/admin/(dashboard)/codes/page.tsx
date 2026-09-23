'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { AccessCodeCard } from '@/components/admin/AccessCodeCard';
import { useSession } from '@/components/admin/SessionProvider';
import { apiAdmin, ApiError } from '@/lib/api';
import { AccessCodeRecord } from '@/lib/types';

export default function CodesPage() {
  const { session } = useSession();
  const [codes, setCodes] = useState<AccessCodeRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiAdmin('/admin/access-codes', session.accessToken);
      setCodes(data);
    } catch {
      setLoadError('Impossible de charger les codes d\u2019acces.');
    } finally {
      setLoading(false);
    }
  }, [session.accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSendError(null);
    setSendSuccess(null);
    setSending(true);
    try {
      await apiAdmin('/admin/access-codes', session.accessToken, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSendSuccess(`Code envoye a ${email}.`);
      setEmail('');
      load();
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : "Echec de l'envoi du code.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ocean-800">Codes d&apos;acces</h1>
        <p className="mt-1 text-sm text-ocean-400">
          Un code personnel doit etre envoye a chaque futur membre avant qu&apos;il puisse
          remplir le formulaire.
        </p>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2 text-ocean-700">
          <KeyRound className="h-4 w-4" />
          <h2 className="text-sm font-bold uppercase tracking-wide">Envoyer un nouveau code</h2>
        </div>

        {sendError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            <AlertCircle className="h-4 w-4" /> {sendError}
          </div>
        )}
        {sendSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> {sendSuccess}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Adresse e-mail du membre"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
            />
          </div>
          <Button type="submit" loading={sending}>
            <Send className="h-4 w-4" />
            Envoyer le code
          </Button>
        </form>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ocean-400">
          Codes deja envoyes
        </h2>

        {loading && (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6" />
          </div>
        )}

        {loadError && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <AlertCircle className="h-4 w-4" /> {loadError}
          </div>
        )}

        {!loading && codes && codes.length === 0 && (
          <EmptyState
            icon={<KeyRound className="h-8 w-8" />}
            title="Aucun code envoye pour l'instant"
            description="Les codes que vous envoyez apparaitront ici avec leur statut."
          />
        )}

        {!loading && codes && codes.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {codes.map((record) => (
              <AccessCodeCard key={record.id} record={record} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
