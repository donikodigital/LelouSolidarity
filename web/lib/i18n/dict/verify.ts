//web/lib/i18n/dict/verify.ts
// v1.1 — clé `originCity` renommée `locality` : ce libellé désigne la ligne « Localité » de la carte.
import { pair } from '../pair';

export const verify = pair(
  {
    title: 'Vérification de carte de membre',
    status: {
      ACTIVE: 'Carte active',
      EXPIRING_SOON: 'À renouveler prochainement',
      EXPIRED: 'Carte expirée',
      NONE: 'Aucune carte',
    },
    unavailableTitle: 'Vérification momentanément indisponible',
    unavailableText:
      'Le serveur est peut-être en train de démarrer. Patientez environ une minute puis réessayez. Cela ne signifie pas que la carte est invalide.',
    retry: 'Réessayer',
    notFoundTitle: 'Carte introuvable',
    notFoundText: 'Ce QR code ne correspond à aucune carte de membre connue.',
    photoOf: 'Photo de {name}',
    fullName: 'Nom complet',
    memberCode: 'Identifiant',
    locality: 'Localité',
    originLocality: 'Localité d’origine',
    residence: 'Résidence',
    position: 'Poste',
    issuedOn: 'Émise le',
    expiresOn: 'Expire le',
    footer: 'Ce statut est vérifié en temps réel auprès de {name}.',
  },
  {
    title: 'Membership card verification',
    status: {
      ACTIVE: 'Active card',
      EXPIRING_SOON: 'To be renewed soon',
      EXPIRED: 'Expired card',
      NONE: 'No card',
    },
    unavailableTitle: 'Verification temporarily unavailable',
    unavailableText:
      'The server may be starting up. Please wait about a minute and try again. This does not mean the card is invalid.',
    retry: 'Try again',
    notFoundTitle: 'Card not found',
    notFoundText: 'This QR code does not match any known membership card.',
    photoOf: 'Photo of {name}',
    fullName: 'Full name',
    memberCode: 'Member ID',
    locality: 'Locality',
    originLocality: 'Locality of origin',
    residence: 'Residence',
    position: 'Position',
    issuedOn: 'Issued on',
    expiresOn: 'Expires on',
    footer: 'This status is verified in real time with {name}.',
  },
  // Pular (Fuuta Jallon) — première version à faire relire par un locuteur
  {
    title: 'Hoolaago karte kawtaaɗo',
    status: {
      ACTIVE: 'Karte ɗon e huuwugo',
      EXPIRING_SOON: 'Sey a hesɗitina karte',
      EXPIRED: 'Karte timmii',
      NONE: 'Karte walaa',
    },
    unavailableTitle: 'Hoolaago waawaa jooni',
    unavailableText:
      'Serveur ɗon fennoo. Reen minti gooto, ɗaɓɓitu. Ɗum hollaa karte wooɗaa.',
    retry: 'Ɗaɓɓitu',
    notFoundTitle: 'Karte tawaaka',
    notFoundText: 'QR code ngoo walaa karte kawtaaɗo anndaaɗo.',
    photoOf: 'Foto {name}',
    fullName: 'Innde timmuɗo',
    memberCode: 'Limngal karte',
    locality: 'Saare',
    originLocality: 'Saare puɗɗorde',
    residence: 'Hoɗorde',
    position: 'Poste',
    issuedOn: 'Waɗaama nde',
    expiresOn: 'Timmoto nde',
    footer: 'Ko ɗum hoolaa jooni e {name}.',
  },
);
