//lelou-solidarity-frontend/components/admin/ForgotPasswordForm.tsx
'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BrandMark } from '@/components/layout/BrandMark';
import { apiPublic, ApiError } from '@/lib/api';
import { ASSOCIATION_NAME } from '@/lib/constants';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiPublic('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
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
        <h1 className="mt-4 text-lg font-bold text-ocean-800">Mot de passe oublie</h1>
        <p className="mt-1 text-sm text-ocean-400">{ASSOCIATION_NAME}</p>
      </div>

      {sent ? (
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-sm text-ocean-600">
            Si un compte existe avec cette adresse, un lien de reinitialisation vient de lui etre envoye.
          </p>
          <Link href="/admin/login" className="mt-2 text-sm font-semibold text-ocean-600 hover:text-ocean-800">
            Retour a la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <p className="text-sm text-ocean-500">
            Indiquez votre adresse e-mail, nous vous enverrons un lien pour choisir un nouveau mot de passe.
          </p>
          <Input
            label="Adresse e-mail"
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
            <Mail className="h-4 w-4" />
            Envoyer le lien
          </Button>
          <Link
            href="/admin/login"
            className="mt-1 flex items-center justify-center gap-1.5 text-sm font-medium text-ocean-500 hover:text-ocean-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour a la connexion
          </Link>
        </form>
      )}
    </Card>
  );
}