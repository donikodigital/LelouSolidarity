//backend/src/common/frontend-url.ts
// Un seul endroit pour lire FRONTEND_URL : utilise par les e-mails (lien du
// formulaire, reinitialisation de mot de passe) et par les QR codes des cartes.
import { Logger } from '@nestjs/common';

const logger = new Logger('FrontendUrl');

/**
 * FRONTEND_URL doit contenir UNE seule adresse : la racine du site public
 * (ex. https://lelou-solidarity.vercel.app). Les origines multiples pour le
 * CORS se declarent dans CORS_ORIGINS, pas ici.
 *
 * Une valeur invalide fait echouer le demarrage avec un message explicite,
 * plutot que de generer en silence des liens casses dans les e-mails et des
 * QR codes impossibles a scanner. Renvoie l'adresse sans "/" final.
 */
export function resolveFrontendUrl(raw: string | undefined): string {
  const value = (raw ?? '').trim();

  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FRONTEND_URL est obligatoire en production (ex. https://lelou-solidarity.vercel.app).',
      );
    }
    logger.warn('FRONTEND_URL est vide : utilisation de http://localhost:3000');
    return 'http://localhost:3000';
  }

  if (/[,;\s]/.test(value)) {
    throw new Error(
      `FRONTEND_URL doit contenir une seule adresse (valeur recue : "${value}"). ` +
        'Les origines multiples se declarent dans CORS_ORIGINS.',
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      `FRONTEND_URL n'est pas une URL valide (valeur recue : "${value}"). ` +
        'Format attendu : https://lelou-solidarity.vercel.app',
    );
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`FRONTEND_URL doit commencer par https:// ou http:// (recu : "${value}").`);
  }

  // origin = protocole + domaine (+ port) : retire le "/" final et tout chemin
  return url.origin;
}