//backend/src/common/error-messages.ts
// Traduction centralisée des messages d'erreur. Les services et les DTO
// continuent d'écrire leurs messages en français (source) ; le filtre
// d'exceptions (http-exception.filter.ts) les traduit selon la langue de la
// requête. Ajouter un nouveau message d'erreur = l'ajouter ici s'il doit
// exister en anglais (à défaut, il reste affiché en français).
import { Locale } from './i18n';

/** Clé de comparaison : sans accents, sans majuscules, apostrophes unifiées, sans point final. */
export function normalizeKey(message: string): string {
  return message
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘`]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!\s]+$/, '');
}

// [français, anglais]
const PAIRS: [string, string][] = [
  // --- Formulaire de demande
  ['Le prénom est obligatoire.', 'First name is required.'],
  ['Le prénom est trop long.', 'First name is too long.'],
  ['Le nom est obligatoire.', 'Last name is required.'],
  ['Le nom est trop long.', 'Last name is too long.'],
  ['La ville est obligatoire.', 'City is required.'],
  ['Le nom de la ville est trop long.', 'The city name is too long.'],
  ['L’état est obligatoire.', 'State is required.'],
  ['Le nom de l’état est trop long.', 'The state name is too long.'],
  ['Le pays est obligatoire.', 'Country is required.'],
  ['Le nom du pays est trop long.', 'The country name is too long.'],
  ['Adresse e-mail invalide.', 'Invalid e-mail address.'],
  ['L’adresse e-mail est trop longue.', 'The e-mail address is too long.'],
  ['Le numéro de téléphone est obligatoire.', 'Phone number is required.'],
  ['Numéro de téléphone invalide.', 'Invalid phone number.'],
  ['Ce champ contient des caractères non autorisés.', 'This field contains characters that are not allowed.'],
  ['Demande introuvable.', 'Request not found.'],
  // --- Formulaire d'adhésion
  ["Code d'acces invalide", 'Invalid access code.'],
  ['Date de naissance invalide', 'Invalid date of birth.'],
  ['La ville de naissance est obligatoire', 'City of birth is required.'],
  [
    'La ville de naissance est trop longue (120 caractères maximum)',
    'City of birth is too long (120 characters maximum).',
  ],
  ['La localité d’origine est obligatoire', 'Locality of origin is required.'],
  [
    'La localité d’origine est trop longue (120 caractères maximum)',
    'Locality of origin is too long (120 characters maximum).',
  ],
  ['La photo d’identité est obligatoire.', 'The ID photo is required.'],
  ['La photo doit être au format JPG ou PNG.', 'The photo must be in JPG or PNG format.'],
  ['La photo ne doit pas dépasser 10 Mo.', 'The photo must not exceed 10 MB.'],
  [
    'Ce lien a déjà été utilisé : le formulaire ne peut plus être rempli.',
    'This link has already been used: the form can no longer be filled in.',
  ],
  [
    'Une demande existe déjà pour cette personne. Contactez l’association si vous pensez qu’il s’agit d’une erreur.',
    'A request already exists for this person. Contact the association if you think this is a mistake.',
  ],
  [
    'La photo n’a pas pu être enregistrée, merci de réessayer avec une autre photo (JPG ou PNG).',
    'The photo could not be saved, please try again with another photo (JPG or PNG).',
  ],
  [
    'Votre demande n’a pas pu être enregistrée. Votre lien reste valable : merci de réessayer dans quelques instants.',
    'Your request could not be saved. Your link is still valid: please try again in a few moments.',
  ],
  ['Membre introuvable.', 'Member not found.'],
  ['Aucun champ ne peut être vide.', 'No field can be empty.'],
  ['Aucune modification à enregistrer.', 'No changes to save.'],
  // --- Authentification
  ['Identifiants incorrects', 'Incorrect e-mail or password.'],
  ['Adresse e-mail invalide', 'Invalid e-mail address.'],
  ['Mot de passe trop court', 'Password too short.'],
  [
    'Le mot de passe doit contenir au moins 8 caracteres',
    'The password must be at least 8 characters long.',
  ],
  [
    'Si un compte existe avec cet e-mail, un lien de reinitialisation a ete envoye.',
    'If an account exists with this e-mail, a reset link has been sent.',
  ],
  [
    'Ce lien de reinitialisation est invalide ou a expire.',
    'This reset link is invalid or has expired.',
  ],
  ['Mot de passe mis a jour avec succes.', 'Password updated successfully.'],
  ['Compte administrateur introuvable', 'Administrator account not found.'],
  [
    'Session expirée, merci de vous reconnecter',
    'Your session has expired, please sign in again.',
  ],
  // --- Codes d'accès
  [
    "Impossible de generer un code d'acces unique, reessaie.",
    'Unable to generate a unique access code, please try again.',
  ],
  ["Code d'acces introuvable.", 'Access code not found.'],
  [
    'Impossible de modifier un code deja utilise par un membre.',
    'A code already used by a member cannot be edited.',
  ],
  [
    'Impossible de supprimer un code deja utilise par un membre.',
    'A code already used by a member cannot be deleted.',
  ],
  // --- Cartes
  ['Carte introuvable.', 'Card not found.'],
  ['La génération du PDF de la carte a échoué.', 'Generating the card PDF failed.'],
  [
    'Le PDF n’a pas pu être enregistré sur Cloudinary. Vérifie les identifiants et les autorisations du compte.',
    'The PDF could not be saved to Cloudinary. Check the account credentials and permissions.',
  ],
  [
    "Aucune carte generee pour ce membre pour l'instant.",
    'No card has been generated for this member yet.',
  ],
  // --- Général
  ['Erreur interne du serveur', 'Internal server error.'],
  [
    'Trop de requêtes, merci de réessayer un peu plus tard.',
    'Too many requests, please try again a little later.',
  ],
  ['Non autorisé', 'Unauthorized.'],
  ['Accès refusé', 'Access denied.'],
  ['Ressource introuvable', 'Resource not found.'],
  ['Requête invalide', 'Invalid request.'],
  [
    'La photo est trop volumineuse (10 Mo maximum).',
    'The photo is too large (10 MB maximum).',
  ],
  ['Une erreur est survenue, merci de réessayer.', 'Something went wrong, please try again.'],
];

const FR_TO_EN = new Map<string, string>(PAIRS.map(([fr, en]) => [normalizeKey(fr), en]));
const EN_TO_FR = new Map<string, string>(PAIRS.map(([fr, en]) => [normalizeKey(en), fr]));

// Pular (Fuuta Jallon) — sous-ensemble des messages vus par le public, à faire
// relire par un locuteur. Un message absent de cette liste reste en français.
// [français, pular]
const FF_PAIRS: [string, string][] = [
  ['Le prénom est obligatoire.', 'Innde ɗon haani winndugo.'],
  ['Le prénom est trop long.', 'Innde ɗoo juutii.'],
  ['Le nom est obligatoire.', 'Yettoode ɗon haani winndugo.'],
  ['Le nom est trop long.', 'Yettoode ɗoo juutii.'],
  ['La ville est obligatoire.', 'Wuro ɗon haani winndugo.'],
  ['L’état est obligatoire.', 'État ɗon haani winndugo.'],
  ['Le pays est obligatoire.', 'Leydi ɗon haani winndugo.'],
  ['Adresse e-mail invalide.', 'Imeel ɗoo wooɗaa.'],
  ['Le numéro de téléphone est obligatoire.', 'Limngal telefon ɗon haani winndugo.'],
  ['Numéro de téléphone invalide.', 'Limngal telefon ngal wooɗaa.'],
  ['Demande introuvable.', 'Ƴamol tawaaka.'],
  ["Code d'acces invalide", 'Kodo naatugo wooɗaa.'],
  ['La photo d’identité est obligatoire.', 'Foto maaɗa haani.'],
  ['La photo doit être au format JPG ou PNG.', 'Foto ɗo ngalaa: huutinan JPG malla PNG.'],
  ['La photo ne doit pas dépasser 10 Mo.', 'Foto ɗo mawni ɓuri 10 Mo.'],
  ['La photo est trop volumineuse (10 Mo maximum).', 'Foto ɗo mawni ɓuri 10 Mo.'],
  [
    'Ce lien a déjà été utilisé : le formulaire ne peut plus être rempli.',
    'Lien ngoo huutinaama doole: formulaire waawaa winndeede fahin.',
  ],
  [
    'Une demande existe déjà pour cette personne. Contactez l’association si vous pensez qu’il s’agit d’une erreur.',
    'Ƴamol woni doole ngam ko goɗɗo. Ɗaɓɓu kawtal si a anndi ɗum fenaande.',
  ],
  [
    'Votre demande n’a pas pu être enregistrée. Votre lien reste valable : merci de réessayer dans quelques instants.',
    'Ƴamol maaɗa winndaaka. Lien maaɗa ɗon hoolaa: ɗaɓɓitu ɓaawo seeɗa.',
  ],
  // --- Espace administrateur
  ['Identifiants incorrects', 'Imeel malla sirru wooɗaa.'],
  ['Mot de passe trop court', 'Sirru ɗoo juutaaki.'],
  [
    'Le mot de passe doit contenir au moins 8 caracteres',
    'Sirru haani yoga 8 limle malla ɓuri.',
  ],
  [
    'Si un compte existe avec cet e-mail, un lien de reinitialisation a ete envoye.',
    'Si konte woni e imeel ɗoo, lien sanjugo sirru neldaama.',
  ],
  [
    'Ce lien de reinitialisation est invalide ou a expire.',
    'Lien sanjugo ngoo wooɗaa malla timmii.',
  ],
  ['Mot de passe mis a jour avec succes.', 'Sirru sanjaama.'],
  ['Compte administrateur introuvable', 'Konte administrateur tawaaka.'],
  ['Session expirée, merci de vous reconnecter', 'Naatugo maaɗa timmii, naatu fahin.'],
  ['Membre introuvable.', 'Kawtaaɗo tawaaka.'],
  ['Carte introuvable.', 'Karte tawaaka.'],
  ["Code d'acces introuvable.", 'Kodo naatugo tawaaka.'],
  ['Non autorisé', 'A haani naatugo.'],
  ['Accès refusé', 'Ɗum haɗaama.'],
  ['Aucune modification à enregistrer.', 'Sanjaaji walaa ngam winndugo.'],
  ['Erreur interne du serveur', 'Ko ɗum waɗi e serveur. Ɗaɓɓitu ɓaawo seeɗa.'],
  [
    'Trop de requêtes, merci de réessayer un peu plus tard.',
    'Ƴamle ɗuuɗi. Ɗaɓɓitu ɓaawo seeɗa.',
  ],
  ['Une erreur est survenue, merci de réessayer.', 'Ɗum waɗaaki. Tiiɗno, ɗaɓɓitu.'],
];
const FR_TO_FF = new Map<string, string>(FF_PAIRS.map(([fr, ff]) => [normalizeKey(fr), ff]));

// Messages par défaut de NestJS / Multer / Throttler (en anglais) → tournures françaises
const GENERIC: Record<string, string> = {
  unauthorized: 'Non autorisé',
  forbidden: 'Accès refusé',
  'not found': 'Ressource introuvable',
  'bad request': 'Requête invalide',
  'internal server error': 'Erreur interne du serveur',
  'too many requests': 'Trop de requêtes, merci de réessayer un peu plus tard.',
  'throttlerexception: too many requests': 'Trop de requêtes, merci de réessayer un peu plus tard.',
  'file too large': 'La photo est trop volumineuse (10 Mo maximum).',
  'payload too large': 'La photo est trop volumineuse (10 Mo maximum).',
};

// Messages dynamiques : début fixe + détail technique conservé tel quel
const PREFIXES: { fr: string; en: string }[] = [
  {
    fr: "Le code n'a pas pu etre envoye par e-mail : ",
    en: 'The code could not be sent by e-mail: ',
  },
];

// Nom de champ → libellé, pour les messages génériques de class-validator
// (ex. « firstName must be shorter than or equal to 80 characters »).
const FIELD_LABELS: Record<string, { fr: string; en: string }> = {
  code: { fr: 'Code d’accès', en: 'Access code' },
  firstName: { fr: 'Prénom', en: 'First name' },
  lastName: { fr: 'Nom', en: 'Last name' },
  birthDate: { fr: 'Année de naissance', en: 'Year of birth' },
  birthCity: { fr: 'Ville de naissance', en: 'City of birth' },
  originDistrict: { fr: 'Ville d’origine', en: 'City of origin' },
  originLocality: { fr: 'Localité d’origine', en: 'Locality of origin' },
  addressLine: { fr: 'Adresse', en: 'Address' },
  city: { fr: 'Ville de résidence', en: 'City of residence' },
  state: { fr: 'État', en: 'State' },
  country: { fr: 'Pays', en: 'Country' },
  zipCode: { fr: 'Code postal', en: 'ZIP code' },
  phone: { fr: 'Téléphone', en: 'Phone' },
  email: { fr: 'Adresse e-mail', en: 'E-mail address' },
  password: { fr: 'Mot de passe', en: 'Password' },
  token: { fr: 'Lien', en: 'Link' },
  locale: { fr: 'Langue', en: 'Language' },
  website: { fr: 'Champ', en: 'Field' },
};

// « firstName must be ... », « property foo should not exist »
const VALIDATOR_DEFAULT = /^(?:property\s+)?(\w+)\s+(?:must|should)\b/;

function genericFieldMessage(field: string, locale: Locale): string {
  const label = FIELD_LABELS[field]?.[locale === 'en' ? 'en' : 'fr'] ?? field;
  return locale === 'en'
    ? `The “${label}” field is invalid or missing.`
    : `Le champ « ${label} » est invalide ou manquant.`;
}

/** Traduit un message d'erreur dans la langue demandée ; renvoie le message d'origine s'il est inconnu. */
export function translateMessage(message: string, locale: Locale): string {
  if (typeof message !== 'string' || !message) return message;
  const key = normalizeKey(message);

  if (locale === 'ff') {
    // Pular : on passe par le français, puis on cherche la version pular (sinon français).
    const french = translateMessage(message, 'fr');
    return FR_TO_FF.get(normalizeKey(french)) ?? french;
  }

  if (locale === 'en') {
    const direct = FR_TO_EN.get(key);
    if (direct) return direct;
    for (const p of PREFIXES) {
      if (message.startsWith(p.fr)) return p.en + message.slice(p.fr.length);
    }
  } else {
    const direct = EN_TO_FR.get(key);
    if (direct) return direct;
    const generic = GENERIC[key];
    if (generic) return generic;
  }

  if (locale === 'en') {
    const generic = GENERIC[key];
    if (generic) return translateMessage(generic, 'en');
  }

  const match = VALIDATOR_DEFAULT.exec(message);
  if (match) return genericFieldMessage(match[1], locale);

  return message;
}

export const INTERNAL_ERROR: Record<Locale, string> = {
  fr: 'Erreur interne du serveur',
  en: 'Internal server error.',
  ff: 'Ko ɗum waɗi e serveur. Ɗaɓɓitu ɓaawo seeɗa.',
};

export const TOO_MANY_REQUESTS: Record<Locale, string> = {
  fr: 'Trop de requêtes, merci de réessayer un peu plus tard.',
  en: 'Too many requests, please try again a little later.',
  ff: 'Ƴamle ɗuuɗi. Ɗaɓɓitu ɓaawo seeɗa.',
};
