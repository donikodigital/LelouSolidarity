//web/lib/types.ts
import type { PositionCode } from './positions';

export type MemberStatus = 'PENDING' | 'VALIDATED';
export type CardStatus = 'NONE' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthCity: string;
  originDistrict: string;
  originLocality: string;
  /** Poste dans l'association (code) ; « OTHER » = poste saisi dans positionOther. */
  position?: PositionCode;
  positionOther?: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  email: string;
  photoUrl: string;
  status: MemberStatus;
  memberCode: string | null;
  cardStatus: CardStatus;
  cardIssuedAt: string | null;
  cardExpiresAt: string | null;
  cardPdfUrl: string | null;
  /** Langue choisie par le membre (e-mails et carte) : « fr » ou « en ». */
  locale?: string;
  createdAt: string;
}

export interface AccessCodeRecord {
  id: string;
  code: string;
  email: string;
  used: boolean;
  usedAt: string | null;
  createdAt: string;
  member?: { id: string; firstName: string; lastName: string } | null;
}

/** Demande de formulaire d'adhésion faite depuis la page d'accueil. */
export interface FormRequest {
  id: string;
  firstName: string;
  lastName: string;
  city: string;
  state: string;
  country: string;
  email: string;
  phone: string;
  message: string;
  handled: boolean;
  handledAt: string | null;
  /** Langue choisie par le demandeur (e-mails) : « fr » ou « en ». */
  locale?: string;
  createdAt: string;
}

/** Profil du gérant tel que renvoyé par l'API (jamais de mot de passe). */
export interface AdminProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatarUrl: string | null;
  /** Reçoit un e-mail à chaque nouvelle demande de formulaire. */
  notifyFormRequests: boolean;
  createdAt: string;
  /** Connexion en cours. */
  lastLoginAt: string | null;
  /** Connexion d'avant : c'est elle qui permet de repérer un accès inattendu. */
  previousLoginAt: string | null;
}

/**
 * Session enregistrée dans le navigateur. Les champs du profil sont facultatifs :
 * une session créée avant l'arrivée de la page profil ne les contient pas encore
 * (ils sont rechargés en silence à l'ouverture de l'espace admin).
 */
export interface AdminSession {
  accessToken: string;
  admin: Pick<AdminProfile, 'id' | 'email' | 'name'> &
    Partial<Omit<AdminProfile, 'id' | 'email' | 'name'>>;
}

export interface VerifyResult {
  valid: boolean;
  status: CardStatus;
  memberCode: string;
  fullName: string;
  originDistrict: string;
  originLocality?: string;
  position?: PositionCode;
  positionOther?: string;
  residence: string;
  issuedAt: string | null;
  expiresAt: string | null;
}