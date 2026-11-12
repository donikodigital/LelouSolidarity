//web/lib/profile.ts
// Petites fonctions du profil du gérant : initiales, taux de complétion,
// force du mot de passe, téléchargement d'un fichier.
import type { AdminSession } from './types';

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

type AdminLike = AdminSession['admin'];

/** Initiales affichées quand il n'y a pas de photo : « Mamadou Diallo » → « MD ». */
export function initialsOf(name: string | null | undefined, email: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (email[0] || '?').toUpperCase();
}

export type ProfileGap = 'name' | 'phone' | 'avatar';

/** Taux de complétion du profil : nom, téléphone, photo (un tiers chacun). */
export function profileCompletion(admin: AdminLike): { percent: number; missing: ProfileGap[] } {
  const missing: ProfileGap[] = [];
  if (!admin.name?.trim()) missing.push('name');
  if (!admin.phone?.trim()) missing.push('phone');
  if (!admin.avatarUrl) missing.push('avatar');
  return { percent: Math.round(((3 - missing.length) / 3) * 100), missing };
}

/** Note de 0 à 4 pour le mot de passe (indicatif : la règle du serveur reste 8 caractères minimum). */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0;
  if (password.length < PASSWORD_MIN) return 1;
  let points = 1;
  if (password.length >= 12) points++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points++;
  if (/\d/.test(password)) points++;
  if (/[^A-Za-z0-9]/.test(password)) points++;
  return Math.min(4, points) as 1 | 2 | 3 | 4;
}

/**
 * Réduit une photo avant l'envoi : côté le plus long limité à `maxSide` px, JPEG.
 * Une photo de téléphone (12 Mpx, plusieurs Mo) devient un fichier léger, et l'orientation
 * EXIF est appliquée. Le recadrage carré sur le visage est fait par le serveur.
 */
export async function shrinkImage(file: File, maxSide = 1280): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.fillStyle = '#ffffff'; // fond blanc : un PNG transparent ne devient pas noir en JPEG
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob'))), 'image/jpeg', 0.88),
    );
  } finally {
    bitmap.close();
  }
}

/** Déclenche le téléchargement d'un fichier dans le navigateur. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
