//lelou-solidarity-backend/src/auth/dto/login.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Adresse e-mail invalide' })
  email: string;

  @IsString()
  @MinLength(4, { message: 'Mot de passe trop court' })
  password: string;
}
