//backend/src/admin-profile/dto/profile.dto.ts
// Données reçues par la page « Mon profil ». Les messages sont écrits en français
// (source) ; ils sont traduits par common/error-messages.ts selon la langue de la requête.
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { LOCALES } from '../../common/i18n';

export class UpdateProfileDto {
  // Chaîne vide = effacer le nom
  @IsOptional()
  @IsString()
  @MaxLength(80, { message: 'Le nom est trop long (80 caractères maximum).' })
  name?: string;

  // Numéro libre (US ou étranger) ; chaîne vide = effacer
  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'Numéro de téléphone invalide.' })
  @Matches(/^[0-9+().\-\s]*$/, { message: 'Numéro de téléphone invalide.' })
  phone?: string;

  @IsOptional()
  @IsBoolean()
  notifyFormRequests?: boolean;

  // Langue d'affichage du gérant : retrouvée à chaque connexion, sur n'importe quel appareil
  @IsOptional()
  @IsIn([...LOCALES], { message: 'Langue invalide.' })
  locale?: (typeof LOCALES)[number];
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1, { message: 'Mot de passe actuel incorrect.' })
  @MaxLength(200, { message: 'Mot de passe actuel incorrect.' })
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caracteres' })
  // bcrypt ignore tout ce qui dépasse 72 octets
  @MaxLength(72, { message: 'Le mot de passe est trop long (72 caractères maximum).' })
  newPassword: string;
}

export class ChangeEmailDto {
  @IsEmail({}, { message: 'Adresse e-mail invalide' })
  @MaxLength(254, { message: 'Adresse e-mail invalide' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Mot de passe actuel incorrect.' })
  @MaxLength(200, { message: 'Mot de passe actuel incorrect.' })
  currentPassword: string;
}
