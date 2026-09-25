import { IsEmail } from 'class-validator';

export class GenerateAccessCodeDto {
  @IsEmail({}, { message: 'Adresse e-mail invalide' })
  email: string;
}
