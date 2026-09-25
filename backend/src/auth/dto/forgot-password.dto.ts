//lelou-solidarity-backend/src/auth/dto/forgot-password.dto.ts
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Adresse e-mail invalide' })
  email: string;
}