//backend/src/access-codes/dto/update-code.dto.ts
import { IsEmail, IsOptional } from 'class-validator';

export class UpdateAccessCodeDto {
  @IsOptional()
  @IsEmail({}, { message: 'Adresse e-mail invalide' })
  email?: string;
}