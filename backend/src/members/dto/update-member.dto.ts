//backend/src/members/dto/update-member.dto.ts
import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

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
  originDistrict?: string;

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