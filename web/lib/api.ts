//web/lib/api.ts
// v1.1 — apiAdminBlob() : téléchargement de fichiers (export CSV des membres).
import { clearSession } from './auth';
import { readClientLocale } from './i18n/client';
import { getDictionary } from './i18n';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function errorMessage(body: { message?: string | string[] } | null): string {
  const message = body?.message;
  if (Array.isArray(message)) return message[0] || getDictionary(readClientLocale()).common.genericError;
  return message || getDictionary(readClientLocale()).common.genericError;
}

async function parseResponse(res: Response) {
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(errorMessage(body), res.status);
  }

  return body;
}

/** Appels vers les routes publiques (pas d'authentification). */
export async function apiPublic(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    // X-Lang : le serveur répond (erreurs, e-mails, carte) dans la langue du visiteur
    headers: { 'X-Lang': readClientLocale(), ...(init.headers || {}) },
  });
  return parseResponse(res);
}

/**
 * Session expirée ou invalide (token JWT périmé, mot de passe changé, appareils
 * déconnectés) : on nettoie et on renvoie vers la connexion plutôt que d'afficher
 * une erreur générique sans issue à l'administrateur.
 */
function expireSession(): Promise<never> {
  clearSession();
  window.location.href = '/admin/login';
  // Empêche le code appelant de continuer avec une réponse invalide
  // pendant que la redirection se produit.
  return new Promise<never>(() => {});
}

/**
 * Appels vers les routes admin (Bearer token requis).
 * Attention : toute réponse 401 déconnecte l'administrateur. Le serveur répond donc
 * 400 (et non 401) quand un mot de passe saisi dans un formulaire est incorrect.
 */
export async function apiAdmin(path: string, token: string, init: RequestInit = {}) {
  const isFormData = init.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Lang': readClientLocale(),
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init.headers || {}),
    },
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    return expireSession();
  }

  return parseResponse(res);
}

/** Téléchargement d'un fichier depuis une route admin (ex. export CSV). */
export async function apiAdminBlob(path: string, token: string): Promise<Blob> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'X-Lang': readClientLocale() },
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    return expireSession();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(errorMessage(body), res.status);
  }
  return res.blob();
}

export { API_URL };
