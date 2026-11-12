//web/components/admin/profile/ProfileHeader.tsx
// Carte d'identité du gérant : photo (ajout / changement / suppression), nom, rôle,
// e-mail, ancienneté et jauge de complétion du profil.
'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Loader2, Mail, ShieldCheck, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/admin/Avatar';
import { useSession } from '@/components/admin/SessionProvider';
import { Notice, type Flash } from './Section';
import { apiAdmin, ApiError } from '@/lib/api';
import { profileCompletion, shrinkImage } from '@/lib/profile';
import { ASSOCIATION_NAME } from '@/lib/constants';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { fmt } from '@/lib/i18n/pair';
import type { AdminProfile } from '@/lib/types';

const MAX_PICK_BYTES = 25 * 1024 * 1024; // avant réduction : on refuse seulement l'énorme

export function ProfileHeader() {
  const { session, updateAdmin } = useSession();
  const { admin } = session;
  const { t, intl } = useI18n();
  const ta = t.admin.account;

  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);

  const { percent, missing } = profileCompletion(admin);

  // La jauge se remplit en douceur à l'affichage (et à chaque changement)
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(percent));
    return () => cancelAnimationFrame(id);
  }, [percent]);

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // permet de rechoisir le même fichier
    if (!file) return;
    setFlash(null);

    if (file.size > MAX_PICK_BYTES) {
      setFlash({ kind: 'error', text: ta.avatar.unreadable });
      return;
    }

    setBusy(true);
    try {
      let blob: Blob;
      try {
        blob = await shrinkImage(file);
      } catch {
        setFlash({ kind: 'error', text: ta.avatar.unreadable });
        return;
      }
      const body = new FormData();
      body.append('avatar', blob, 'avatar.jpg');
      const updated = (await apiAdmin('/admin/profile/avatar', session.accessToken, {
        method: 'POST',
        body,
      })) as AdminProfile;
      updateAdmin(updated);
      setFlash({ kind: 'success', text: ta.avatar.updated });
    } catch (err) {
      setFlash({ kind: 'error', text: err instanceof ApiError ? err.message : ta.avatar.failed });
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    setFlash(null);
    setBusy(true);
    try {
      const updated = (await apiAdmin('/admin/profile/avatar', session.accessToken, {
        method: 'DELETE',
      })) as AdminProfile;
      updateAdmin(updated);
      setFlash({ kind: 'success', text: ta.avatar.removed });
    } catch (err) {
      setFlash({ kind: 'error', text: err instanceof ApiError ? err.message : ta.avatar.removeFailed });
    } finally {
      setBusy(false);
    }
  }

  const since = admin.createdAt
    ? new Date(admin.createdAt).toLocaleDateString(intl, { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const missingLabel = missing.map((gap) => ta.completion[gap]).join(', ');

  return (
    <section className="animate-rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-ocean-700 via-ocean-600 to-ocean-500 p-5 text-white shadow-xl shadow-ocean-900/20 sm:p-7">
      <span className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#D8B65C]/30 blur-2xl" />
      <span className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        {/* Photo */}
        <div className="flex flex-shrink-0 flex-col items-center gap-2">
          <div className="relative">
            <Avatar
              name={admin.name}
              email={admin.email}
              src={admin.avatarUrl}
              size={104}
              ring
              className="shadow-xl shadow-ocean-900/30"
            />
            {busy && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ocean-900/55">
                <Loader2 className="h-6 w-6 animate-spin" />
              </span>
            )}
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={busy}
              aria-label={admin.avatarUrl ? ta.avatar.change : ta.avatar.add}
              className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#F3E2A9] to-[#D8B65C] text-ocean-900 shadow-lg ring-2 ring-ocean-600 transition active:scale-90 disabled:opacity-60"
            >
              <Camera className="h-5 w-5" />
            </button>
            <input
              ref={fileInput}
              type="file"
              // Liste explicite : sur iPhone, une photo HEIC est alors convertie en JPEG
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onPick}
            />
          </div>
          {admin.avatarUrl && (
            <button
              type="button"
              onClick={onRemove}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-ocean-100 transition hover:bg-white/10 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {ta.avatar.remove}
            </button>
          )}
        </div>

        {/* Identité */}
        <div className="min-w-0 max-w-full flex-1">
          <h1 className="break-words text-2xl font-extrabold tracking-tight sm:text-3xl">
            {admin.name?.trim() || ta.manager}
          </h1>
          <span className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#F3E2A9] ring-1 ring-white/15">
            <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{fmt(ta.roleLine, { name: ASSOCIATION_NAME })}</span>
          </span>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-ocean-100 sm:justify-start">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span className="min-w-0 break-all">{admin.email}</span>
          </p>
          {since && <p className="mt-1 text-xs text-ocean-200">{fmt(ta.memberSince, { date: since })}</p>}
        </div>
      </div>

      {/* Complétion du profil */}
      <div className="relative mt-5 rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/15 backdrop-blur">
        <div className="flex items-center justify-between gap-3 text-sm font-bold">
          <span className="flex min-w-0 items-center gap-1.5">
            {percent === 100 && <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#F3E2A9]" />}
            <span className="truncate">
              {percent === 100 ? ta.completion.complete : fmt(ta.completion.title, { percent })}
            </span>
          </span>
          <span className="text-[#F3E2A9]">{percent}%</span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-white/15"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#F3E2A9] to-[#D8B65C] transition-[width] duration-700 ease-out"
            style={{ width: `${shown}%` }}
          />
        </div>
        {missing.length > 0 && (
          <p className="mt-2 text-xs text-ocean-100">{fmt(ta.completion.missing, { items: missingLabel })}</p>
        )}
      </div>

      {flash && (
        <div className="relative mt-3 text-left">
          <Notice flash={flash} />
        </div>
      )}
    </section>
  );
}
