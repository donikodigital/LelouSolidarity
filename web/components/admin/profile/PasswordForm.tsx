//web/components/admin/profile/PasswordForm.tsx
'use client';

import { FormEvent, useState } from 'react';
import clsx from 'clsx';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/components/admin/SessionProvider';
import { Notice, type Flash } from './Section';
import { apiAdmin, ApiError } from '@/lib/api';
import { PASSWORD_MAX, PASSWORD_MIN, passwordStrength } from '@/lib/profile';
import { useI18n } from '@/lib/i18n/I18nProvider';

const STRENGTH_COLORS = ['bg-slate-200', 'bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-emerald-500'];

/** `onDone` reçoit le message de succès : le volet se referme, c'est la carte qui l'affiche. */
export function PasswordForm({ onDone }: { onDone: (message: string) => void }) {
  const { session, updateAdmin } = useSession();
  const { t } = useI18n();
  const tp = t.admin.account.security.password;

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);

  const strength = passwordStrength(next);
  const tooShort = next.length > 0 && next.length < PASSWORD_MIN;
  const mismatch = confirm.length > 0 && confirm !== next;
  const ready = current.length > 0 && next.length >= PASSWORD_MIN && confirm === next;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    setFlash(null);
    setSaving(true);
    try {
      const res = (await apiAdmin('/admin/profile/password', session.accessToken, {
        method: 'POST',
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })) as { accessToken: string };
      // Le serveur invalide l'ancien jeton : on enregistre le nouveau pour rester connecté
      updateAdmin({}, res.accessToken);
      setCurrent('');
      setNext('');
      setConfirm('');
      onDone(tp.done);
    } catch (err) {
      setFlash({ kind: 'error', text: err instanceof ApiError ? err.message : tp.failed });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        name="current-password"
        label={tp.current}
        type="password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        autoComplete="current-password"
        maxLength={PASSWORD_MAX}
      />
      <div className="flex flex-col gap-2">
        <Input
          name="new-password"
          label={tp.next}
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          maxLength={PASSWORD_MAX}
          error={tooShort ? tp.tooShort : undefined}
        />
        {next.length > 0 && (
          <div aria-live="polite">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((step) => (
                <span
                  key={step}
                  className={clsx(
                    'h-1.5 flex-1 rounded-full transition-colors duration-300',
                    step <= strength ? STRENGTH_COLORS[strength] : 'bg-slate-200',
                  )}
                />
              ))}
            </div>
            <p className="mt-1 text-xs font-medium text-ocean-500">{tp.strength[strength]}</p>
          </div>
        )}
      </div>
      <Input
        name="confirm-password"
        label={tp.confirm}
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
        maxLength={PASSWORD_MAX}
        error={mismatch ? tp.mismatch : undefined}
      />
      <Notice flash={flash} />
      <Button type="submit" loading={saving} disabled={!ready} className="w-full">
        {tp.submit}
      </Button>
    </form>
  );
}
