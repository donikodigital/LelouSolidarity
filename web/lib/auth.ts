//lelou-solidarity-frontend/lib/auth.ts
'use client';

import { AdminSession } from './types';
import { resetClientLocale } from './i18n/client';

const STORAGE_KEY = 'lelou-solidarity-admin-session';

export function saveSession(session: AdminSession) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

/**
 * Déconnexion (volontaire, session expirée ou révoquée) : on efface la session ET on remet la
 * langue par défaut, pour que la personne suivante sur cet appareil ne se retrouve pas dans la
 * langue choisie par la précédente. Chaque gérant retrouve la sienne à sa prochaine connexion.
 */
export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  resetClientLocale();
}
