//lelou-solidarity-frontend/components/admin/LoginForm.tsx
'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, LogIn } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BrandMark } from '@/components/layout/BrandMark';
import { apiPublic, ApiError } from '@/lib/api';
import { saveSession } from '@/lib/auth';
import { ASSOCIATION_NAME } from '@/lib/constants';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiPublic('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      saveSession(data);
      router.replace('/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm p-8">
      <div className="flex flex-col items-center text-center">
        <BrandMark onDark={false} />
        <h1 className="mt-4 text-lg font-bold text-ocean-800">Espace administrateur</h1>
        <p className="mt-1 text-sm text-ocean-400">{ASSOCIATION_NAME}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
        <Input
          label="Adresse e-mail"
          type="email"
          name="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Mot de passe"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-end -mt-2">
          <Link href="/admin/forgot-password" className="text-xs font-medium text-ocean-500 hover:text-ocean-700">
            Mot de passe oublié ?
          </Link>
        </div>
        <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
          <LogIn className="h-4 w-4" />
          Se connecter
        </Button>
      </form>
    </Card>
  );
}