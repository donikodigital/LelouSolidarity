//backend/src/auth/password-fingerprint.ts
import { createHash } from 'crypto';

/**
 * Empreinte courte du hash de mot de passe d'un administrateur. Elle est
 * inscrite dans le JWT à la connexion et revérifiée à chaque requête : dès que
 * le mot de passe change (réinitialisation), tous les anciens jetons deviennent
 * invalides, sans nouvelle colonne en base ni migration.
 */
export function passwordFingerprint(passwordHash: string): string {
  return createHash('sha256').update(passwordHash).digest('hex').slice(0, 16);
}
