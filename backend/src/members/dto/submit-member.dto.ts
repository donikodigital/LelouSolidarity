//backend/src/members/dto/submit-member.dto.ts
import { IsDateString, IsEmail, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class SubmitMemberDto {
  @IsString()
  @Length(4, 16, { message: "Code d'acces invalide" })
  code: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName: string;

  @IsDateString({}, { message: 'Date de naissance invalide' })
  birthDate: string;

  @IsString({ message: 'La ville de naissance est obligatoire' })
  @MinLength(1, { message: 'La ville de naissance est obligatoire' })
  @MaxLength(120, { message: 'La ville de naissance est trop longue (120 caractères maximum)' })
  birthCity: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  originDistrict: string;

  // Messages explicites : sans eux, un champ absent (ancienne version du site
  // encore en cache) affichait « must be shorter than or equal to 120 characters ».
  @IsString({ message: 'La localité d’origine est obligatoire' })
  @MinLength(1, { message: 'La localité d’origine est obligatoire' })
  @MaxLength(120, { message: 'La localité d’origine est trop longue (120 caractères maximum)' })
  originLocality: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  addressLine: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  city: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  state: string;

  @IsString({ message: 'Le pays est obligatoire' })
  @MinLength(1, { message: 'Le pays est obligatoire' })
  @MaxLength(80, { message: 'Le nom du pays est trop long' })
  country: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  zipCode: string;

  @IsString()
  @MinLength(6)
  @MaxLength(30)
  phone: string;

  @IsEmail({}, { message: 'Adresse e-mail invalide' })
  email: string;
}