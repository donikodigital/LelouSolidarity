//backend/src/form-requests/dto/create-form-request.dto.ts
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// Pas de saut de ligne ni de balise dans les champs courts (nom, ville...)
const SIMPLE_TEXT = /^[^\r\n<>]+$/;
const SIMPLE_TEXT_MESSAGE = 'Ce champ contient des caractères non autorisés.';

export class CreateFormRequestDto {
  @Transform(trim)
  @IsString({ message: 'Le prénom est obligatoire.' })
  @IsNotEmpty({ message: 'Le prénom est obligatoire.' })
  @MaxLength(80, { message: 'Le prénom est trop long.' })
  @Matches(SIMPLE_TEXT, { message: SIMPLE_TEXT_MESSAGE })
  firstName!: string;

  @Transform(trim)
  @IsString({ message: 'Le nom est obligatoire.' })
  @IsNotEmpty({ message: 'Le nom est obligatoire.' })
  @MaxLength(80, { message: 'Le nom est trop long.' })
  @Matches(SIMPLE_TEXT, { message: SIMPLE_TEXT_MESSAGE })
  lastName!: string;

  @Transform(trim)
  @IsString({ message: 'La ville est obligatoire.' })
  @IsNotEmpty({ message: 'La ville est obligatoire.' })
  @MaxLength(100, { message: 'Le nom de la ville est trop long.' })
  @Matches(SIMPLE_TEXT, { message: SIMPLE_TEXT_MESSAGE })
  city!: string;

  @Transform(trim)
  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  @MaxLength(160, { message: 'L’adresse e-mail est trop longue.' })
  email!: string;

  @Transform(trim)
  @IsString({ message: 'Le numéro de téléphone est obligatoire.' })
  @IsNotEmpty({ message: 'Le numéro de téléphone est obligatoire.' })
  @Matches(/^[0-9+()\-.\s]{6,30}$/, { message: 'Numéro de téléphone invalide.' })
  phone!: string;

  // Champ « piège » invisible pour les humains : un robot le remplit.
  // Déclaré ici car le ValidationPipe refuse les champs inconnus.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}