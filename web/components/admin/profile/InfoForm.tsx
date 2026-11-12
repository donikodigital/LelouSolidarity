//web/components/admin/profile/InfoForm.tsx
'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { UserRound } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/components/admin/SessionProvider';
import { Notice, Section, type Flash } from './Section';
import { apiAdmin, ApiError } from '@/lib/api';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { AdminProfile } from '@/lib/types';

export function InfoForm({ delay }: { delay?: number }) {
  const { session, updateAdmin } = useSession();
  const { admin } = session;
  const { t } = useI18n();
  const ta = t.admin.account;

  const [name, setName] = useState(admin.name ?? '');
  const [phone, setPhone] = useState(admin.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);

  // Quand le profil est rechargé (ou enregistré), les champs suivent, sauf ceux que
  // l'utilisateur est en train de modifier.
  const server = useRef({ name: admin.name ?? '', phone: admin.phone ?? '' });
  useEffect(() => {
    const nextName = admin.name ?? '';
    const nextPhone = admin.phone ?? '';
    setName((cur) => (cur === server.current.name ? nextName : cur));
    setPhone((cur) => (cur === server.current.phone ? nextPhone : cur));
    server.current = { name: nextName, phone: nextPhone };
  }, [admin.name, admin.phone]);

  const dirty = name !== (admin.name ?? '') || phone !== (admin.phone ?? '');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!dirty) return;
    setFlash(null);
    setSaving(true);
    try {
      const updated = (await apiAdmin('/admin/profile', session.accessToken, {
        method: 'PATCH',
        body: JSON.stringify({ name, phone }),
      })) as AdminProfile;
      // Les champs adoptent les valeurs normalisées par le serveur (espaces, format du téléphone)
      server.current = { name: updated.name ?? '', phone: updated.phone ?? '' };
      setName(server.current.name);
      setPhone(server.current.phone);
      updateAdmin(updated);
      setFlash({ kind: 'success', text: ta.info.saved });
    } catch (err) {
      setFlash({ kind: 'error', text: err instanceof ApiError ? err.message : ta.info.failed });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section icon={UserRound} title={ta.info.title} description={ta.info.description} delay={delay}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          name="profile-name"
          label={ta.info.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={ta.info.namePlaceholder}
          maxLength={80}
          autoComplete="name"
        />
        <Input
          name="profile-phone"
          label={ta.info.phone}
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={ta.info.phonePlaceholder}
          maxLength={30}
          autoComplete="tel"
        />
        <div className="flex flex-col gap-1">
          <Input name="profile-email" label={ta.info.email} value={admin.email} disabled readOnly />
          <p className="text-xs text-ocean-400">{ta.info.emailHint}</p>
        </div>
        <Notice flash={flash} />
        <Button type="submit" loading={saving} disabled={!dirty} className="w-full sm:w-auto sm:self-end">
          {ta.info.save}
        </Button>
      </form>
    </Section>
  );
}
