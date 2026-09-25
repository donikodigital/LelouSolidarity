//lelou-solidarity-frontend/lib/types.ts
export type MemberStatus = 'PENDING' | 'VALIDATED';
export type CardStatus = 'NONE' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  originDistrict: string;
  addressLine: string;
  city: string;
  state: string;
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

export interface AdminSession {
  accessToken: string;
  admin: { id: string; email: string; name: string | null };
}

export interface VerifyResult {
  valid: boolean;
  status: CardStatus;
  memberCode: string;
  fullName: string;
  originDistrict: string;
  residence: string;
  issuedAt: string | null;
  expiresAt: string | null;
}
