//web/lib/api.ts
import { clearSession } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseResponse(res: Response) {
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      (body && (body.message || (Array.isArray(body.message) && body.message[0]))) ||
      'Une erreur est survenue, merci de réessayer.';
    throw new ApiError(Array.isArray(message) ? message[0] : message, res.status);
  }

  return body;
}

/** Appels vers les routes publiques (pas d'authentification). */
export async function apiPublic(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...(init.headers || {}) },
  });
  return parseResponse(res);
}

/** Appels vers les routes admin (Bearer token requis). */
export async function apiAdmin(path: string, token: string, init: RequestInit = {}) {
  const isFormData = init.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init.headers || {}),
    },
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    // Session expirée ou invalide (token JWT périmé) : on nettoie et on
    // renvoie vers la connexion plutôt que d'afficher une erreur
    // générique sans issue à l'administrateur.
    clearSession();
    window.location.href = '/admin/login';
    // Empêche le code appelant de continuer avec une réponse invalide
    // pendant que la redirection se produit.
    return new Promise(() => {});
  }

  return parseResponse(res);
}

export { API_URL };