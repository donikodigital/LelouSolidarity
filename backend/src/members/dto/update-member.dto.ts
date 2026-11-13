//backend/src/members/dto/update-member.dto.ts
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MAX_POSITION_OTHER_LENGTH, POSITION_CODES } from '../../common/positions';

// Modification d'un membre par l'administrateur (PATCH) : tous les champs
// sont optionnels, seuls ceux qui sont fournis sont mis a jour.
// Memes regles que SubmitMemberDto (sans le code d'acces ni la photo).
export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Date de naissance invalide' })
  birthDate?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  birthCity?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  originDistrict?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  originLocality?: string;

  /** Poste dans l'association (code). Réservé à l'administrateur : le formulaire public ne le propose pas. */
  @IsOptional()
  @IsIn(POSITION_CODES as unknown as string[], { message: 'Poste invalide' })
  position?: string;

  /** Poste saisi librement, obligatoire quand position = OTHER. */
  @IsOptional()
  @IsString()
  @MaxLength(MAX_POSITION_OTHER_LENGTH, { message: 'Le poste ne doit pas dépasser 60 caractères.' })
  positionOther?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  addressLine?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  state?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  zipCode?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Adresse e-mail invalide' })
  email?: string;
}