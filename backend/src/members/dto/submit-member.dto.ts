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

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  originDistrict: string;

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
