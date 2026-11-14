//backend/src/admin-profile/admin-profile.service.ts
// Page « Mon profil » du gérant : informations, photo, mot de passe, adresse e-mail,
// déconnexion de tous les appareils, préférence de notification et export des membres.
//
// Règles de sécurité :
// - changer le mot de passe ou l'e-mail exige le mot de passe actuel ;
// - une erreur de mot de passe répond 400 (et non 401, qui déconnecterait l'utilisateur
//   côté site) ;
// - après un changement de mot de passe, tous les anciens jetons sont invalides : on renvoie
//   un nouveau jeton pour que l'appareil en cours reste connecté ;
// - un e-mail d'alerte part à l'adresse du compte à chaque changement sensible.
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UploadsService } from '../uploads/uploads.service';
import { adminTokenPayload, toPublicAdmin } from '../auth/admin-session';
import { hasImageSignature } from '../members/members.service';
import { normalizePhone } from '../common/phone';
import { Locale } from '../common/i18n';
import { ChangeEmailDto, ChangePasswordDto, UpdateProfileDto } from './dto/profile.dto';
import { buildMembersCsv } from './members-csv';
import { renderMembersPdf } from './members-pdf';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_AVATAR_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/** WebP : « RIFF » + taille + « WEBP » (la signature de members.service ne couvre que JPG/PNG). */
function isWebp(buffer: Buffer): boolean {
  return (
    buffer.length > 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}

@Injectable()
export class AdminProfileService {
  private readonly logger = new Logger(AdminProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly uploads: UploadsService,
  ) {}

  private async getOrThrow(id: string): Promise<Admin> {
    const admin = await this.prisma.admin.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException('Compte administrateur introuvable');
    return admin;
  }

  /** Nouveau jeton (le précédent n'est plus valable après un changement de mot de passe). */
  private signToken(admin: Admin): Promise<string> {
    return this.jwt.signAsync(adminTokenPayload(admin));
  }

  /** L'alerte de sécurité ne doit jamais faire échouer l'action : on journalise seulement. */
  private async notify(
    to: string,
    admin: Admin,
    kind: 'password' | 'email' | 'sessions',
    locale: Locale,
    newEmail?: string,
  ) {
    try {
      await this.mail.sendSecurityNotice(to, admin.name || '', kind, locale, newEmail);
    } catch (err) {
      this.logger.error(`Échec de l'alerte de sécurité (${kind}) à ${to}: ${(err as Error).message}`);
    }
  }

  async get(id: string) {
    return toPublicAdmin(await this.getOrThrow(id));
  }

  async update(id: string, dto: UpdateProfileDto) {
    await this.getOrThrow(id);

    const data: { name?: string | null; phone?: string | null; notifyFormRequests?: boolean } = {};
    if (dto.name !== undefined) data.name = dto.name.trim().replace(/\s+/g, ' ') || null;
    if (dto.phone !== undefined) data.phone = normalizePhone(dto.phone) || null;
    if (dto.notifyFormRequests !== undefined) data.notifyFormRequests = dto.notifyFormRequests;

    const updated = await this.prisma.admin.update({ where: { id }, data });
    return toPublicAdmin(updated);
  }

  async changePassword(id: string, dto: ChangePasswordDto, locale: Locale) {
    const admin = await this.getOrThrow(id);

    const valid = await bcrypt.compare(dto.currentPassword, admin.passwordHash);
    if (!valid) throw new BadRequestException('Mot de passe actuel incorrect.');
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Le nouveau mot de passe doit être différent de l’actuel.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    const updated = await this.prisma.admin.update({
      where: { id },
      // Un éventuel lien de réinitialisation en attente ne doit plus fonctionner
      data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
    });

    await this.notify(updated.email, updated, 'password', locale);
    return { message: 'Mot de passe mis a jour avec succes.', accessToken: await this.signToken(updated) };
  }

  async changeEmail(id: string, dto: ChangeEmailDto, locale: Locale) {
    const admin = await this.getOrThrow(id);

    const valid = await bcrypt.compare(dto.currentPassword, admin.passwordHash);
    if (!valid) throw new BadRequestException('Mot de passe actuel incorrect.');

    const email = dto.email.toLowerCase().trim();
    if (email === admin.email) {
      throw new BadRequestException('Cette adresse e-mail est déjà celle de votre compte.');
    }
    const taken = await this.prisma.admin.findUnique({ where: { email } });
    if (taken) throw new ConflictException('Cette adresse e-mail est déjà utilisée.');

    const updated = await this.prisma.admin.update({
      where: { id },
      data: { email, resetToken: null, resetTokenExpiresAt: null },
    });

    // L'ancienne adresse est prévenue : c'est elle qui permettrait de détecter un détournement
    await this.notify(admin.email, updated, 'email', locale, email);
    return { admin: toPublicAdmin(updated), accessToken: await this.signToken(updated) };
  }

  async setAvatar(id: string, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucune photo reçue.');
    if (!ALLOWED_AVATAR_MIME.includes(file.mimetype)) {
      throw new BadRequestException('La photo de profil doit être au format JPG, PNG ou WebP.');
    }
    if (file.size > MAX_AVATAR_BYTES) {
      throw new BadRequestException('La photo de profil ne doit pas dépasser 5 Mo.');
    }
    // Le type MIME envoyé par le navigateur peut être falsifié : on vérifie les premiers octets
    if (!hasImageSignature(file.buffer) && !isWebp(file.buffer)) {
      throw new BadRequestException('La photo de profil doit être au format JPG, PNG ou WebP.');
    }

    const admin = await this.getOrThrow(id);
    const upload = await this.uploads.uploadAdminAvatar(file.buffer, admin.id);

    const updated = await this.prisma.admin.update({
      where: { id },
      data: { avatarUrl: upload.secure_url, avatarPublicId: upload.public_id },
    });

    // L'ancienne photo est supprimée après coup : un échec ne bloque pas le changement
    if (admin.avatarPublicId) {
      this.uploads
        .deleteAdminAvatar(admin.avatarPublicId)
        .catch((err) => this.logger.warn(`Ancienne photo non supprimée: ${(err as Error).message}`));
    }
    return toPublicAdmin(updated);
  }

  async removeAvatar(id: string) {
    const admin = await this.getOrThrow(id);
    const updated = await this.prisma.admin.update({
      where: { id },
      data: { avatarUrl: null, avatarPublicId: null },
    });
    if (admin.avatarPublicId) {
      this.uploads
        .deleteAdminAvatar(admin.avatarPublicId)
        .catch((err) => this.logger.warn(`Photo non supprimée: ${(err as Error).message}`));
    }
    return toPublicAdmin(updated);
  }

  /** Déconnecte tous les appareils, sauf celui-ci qui reçoit un jeton neuf. */
  async revokeSessions(id: string, locale: Locale) {
    const admin = await this.getOrThrow(id);
    const updated = await this.prisma.admin.update({
      where: { id },
      data: { sessionsRevokedAt: new Date() },
    });
    await this.notify(admin.email, updated, 'sessions', locale);
    return { accessToken: await this.signToken(updated) };
  }

  /** Liste complète des membres en CSV. */
  async exportMembers(locale: Locale): Promise<string> {
    const members = await this.prisma.member.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        memberCode: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        birthCity: true,
        originDistrict: true,
        originLocality: true,
        position: true,
        positionOther: true,
        addressLine: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        phone: true,
        email: true,
        locale: true,
        status: true,
        cardStatus: true,
        cardIssuedAt: true,
        cardExpiresAt: true,
        createdAt: true,
      },
    });
    return buildMembersCsv(members, locale);
  }

  /** Liste complète des membres en PDF (A4 paysage, tri alphabétique). */
  async exportMembersPdf(locale: Locale): Promise<Buffer> {
    const members = await this.prisma.member.findMany({
      select: {
        memberCode: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        originDistrict: true,
        originLocality: true,
        position: true,
        positionOther: true,
        city: true,
        state: true,
        phone: true,
        email: true,
        status: true,
        cardStatus: true,
        cardExpiresAt: true,
      },
    });
    return renderMembersPdf(members, locale);
  }
}
