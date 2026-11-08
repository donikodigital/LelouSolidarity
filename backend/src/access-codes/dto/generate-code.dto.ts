import { IsEmail, IsIn, IsOptional } from 'class-validator';
import { LOCALES } from '../../common/i18n';

export class GenerateAccessCodeDto {
  @IsEmail({}, { message: 'Adresse e-mail invalide' })
  email: string;

  /** Langue de l'e-mail envoyé au futur membre (par défaut : langue de l'interface). */
  @IsOptional()
  @IsIn([...LOCALES])
  locale?: string;
}
