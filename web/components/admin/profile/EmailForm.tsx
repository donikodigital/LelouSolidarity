//web/components/admin/profile/EmailForm.tsx
'use client';

import { FormEvent, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/components/admin/SessionProvider';
import { Notice, type Flash } from './Section';
import { apiAdmin, ApiError } from '@/lib/api';
import { PASSWORD_MAX } from '@/lib/profile';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { AdminProfile } from '@/lib/types';

/** `onDone` reçoit le message de succès : le volet se referme, c'est la carte qui l'affiche. */
export function EmailForm({ onDone }: { onDone: (message: string) => void }) {
  const { session, updateAdmin } = useSession();
  const { t } = useI18n();
  const te = t.admin.account.security.email;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);

  const ready = /^\S+@\S+\.\S+$/.test(email.trim()) && password.length > 0;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    setFlash(null);
    setSaving(true);
    try {
      const res = (await apiAdmin('/admin/profile/email', session.accessToken, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), currentPassword: password }),
      })) as { admin: AdminProfile; accessToken: string };
      // Le jeton contient l'adresse e-mail : il est renouvelé en même temps que le profil
      updateAdmin(res.admin, res.accessToken);
      setEmail('');
      setPassword('');
      onDone(te.done);
    } catch (err) {
      setFlash({ kind: 'error', text: err instanceof ApiError ? err.message : te.failed });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        name="new-email"
        label={te.next}
        type="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        maxLength={254}
      />
      <Input
        name="email-current-password"
        label={te.currentPassword}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        maxLength={PASSWORD_MAX}
      />
      <p className="text-xs leading-snug text-ocean-400">{te.hint}</p>
      <Notice flash={flash} />
      <Button type="submit" loading={saving} disabled={!ready} className="w-full">
        {te.submit}
      </Button>
    </form>
  );
}
