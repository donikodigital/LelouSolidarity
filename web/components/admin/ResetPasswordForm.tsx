//lelou-solidarity-frontend/components/admin/ResetPasswordForm.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BrandMark } from '@/components/layout/BrandMark';
import { apiPublic, ApiError } from '@/lib/api';
import { ASSOCIATION_NAME } from '@/lib/constants';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await apiPublic('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
      setTimeout(() => router.replace('/admin/login'), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm p-8">
      <div className="flex flex-col items-center text-center">
        <BrandMark onDark={false} />
        <h1 className="mt-4 text-lg font-bold text-ocean-800">Nouveau mot de passe</h1>
        <p className="mt-1 text-sm text-ocean-400">{ASSOCIATION_NAME}</p>
      </div>

      {done ? (
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-sm text-ocean-600">Mot de passe mis a jour. Redirection vers la connexion...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <Input
            label="Nouveau mot de passe"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirmer le mot de passe"
            type="password"
            name="confirm"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
            <KeyRound className="h-4 w-4" />
            Reinitialiser le mot de passe
          </Button>
          <Link href="/admin/login" className="mt-1 text-center text-sm font-medium text-ocean-500 hover:text-ocean-700">
            Retour a la connexion
          </Link>
        </form>
      )}
    </Card>
  );
}