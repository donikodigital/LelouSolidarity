//backend/src/auth/admin-session.ts
// Éléments communs à la connexion et à la page « Mon profil » : contenu du jeton
// et représentation de l'administrateur envoyée au site (jamais le hash ni les jetons).
import { Admin } from '@prisma/client';
import { passwordFingerprint } from './password-fingerprint';

/** Contenu du JWT : `pv` invalide le jeton dès que le mot de passe change. */
export function adminTokenPayload(admin: Pick<Admin, 'id' | 'email' | 'passwordHash'>) {
  return {
    sub: admin.id,
    email: admin.email,
    pv: passwordFingerprint(admin.passwordHash),
  };
}

/** L'administrateur tel que le site l'affiche. */
export function toPublicAdmin(admin: Admin) {
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    phone: admin.phone,
    avatarUrl: admin.avatarUrl,
    notifyFormRequests: admin.notifyFormRequests,
    locale: admin.locale,
    createdAt: admin.createdAt,
    lastLoginAt: admin.lastLoginAt,
    previousLoginAt: admin.previousLoginAt,
  };
}

export type PublicAdmin = ReturnType<typeof toPublicAdmin>;
