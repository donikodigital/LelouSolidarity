//backend/src/admin-profile/admin-profile.controller.ts
// Routes de la page « Mon profil » (toutes réservées à l'administrateur connecté) :
//   GET    /api/admin/profile                  profil
//   PATCH  /api/admin/profile                  nom, téléphone, préférence d'alerte
//   POST   /api/admin/profile/password         changer le mot de passe
//   POST   /api/admin/profile/email            changer l'adresse e-mail
//   POST   /api/admin/profile/avatar           envoyer la photo de profil (champ « avatar »)
//   DELETE /api/admin/profile/avatar           retirer la photo
//   POST   /api/admin/profile/sessions/revoke  se déconnecter de tous les appareils
//   GET    /api/admin/export/members           liste des membres en CSV
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentAdmin, CurrentAdminPayload } from '../common/decorators/current-admin.decorator';
import { Lang, Locale } from '../common/i18n';
import { AdminProfileService } from './admin-profile.service';
import { ChangeEmailDto, ChangePasswordDto, UpdateProfileDto } from './dto/profile.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminProfileController {
  constructor(private readonly profile: AdminProfileService) {}

  @Get('profile')
  get(@CurrentAdmin() admin: CurrentAdminPayload) {
    return this.profile.get(admin.sub);
  }

  @Patch('profile')
  update(@CurrentAdmin() admin: CurrentAdminPayload, @Body() dto: UpdateProfileDto) {
    return this.profile.update(admin.sub, dto);
  }

  // Changements sensibles : 5 essais par 10 minutes (empêche de deviner le mot de passe actuel)
  @Post('profile/password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  changePassword(
    @CurrentAdmin() admin: CurrentAdminPayload,
    @Body() dto: ChangePasswordDto,
    @Lang() lang: Locale,
  ) {
    return this.profile.changePassword(admin.sub, dto, lang);
  }

  @Post('profile/email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  changeEmail(
    @CurrentAdmin() admin: CurrentAdminPayload,
    @Body() dto: ChangeEmailDto,
    @Lang() lang: Locale,
  ) {
    return this.profile.changeEmail(admin.sub, dto, lang);
  }

  @Post('profile/avatar')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: 5 * 1024 * 1024 } }))
  setAvatar(@CurrentAdmin() admin: CurrentAdminPayload, @UploadedFile() file?: Express.Multer.File) {
    return this.profile.setAvatar(admin.sub, file);
  }

  @Delete('profile/avatar')
  removeAvatar(@CurrentAdmin() admin: CurrentAdminPayload) {
    return this.profile.removeAvatar(admin.sub);
  }

  @Post('profile/sessions/revoke')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  revokeSessions(@CurrentAdmin() admin: CurrentAdminPayload, @Lang() lang: Locale) {
    return this.profile.revokeSessions(admin.sub, lang);
  }

  // 5 exports par minute : la requête lit toute la table des membres
  @Get('export/members')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async exportMembers(@Lang() lang: Locale, @Res({ passthrough: true }) res: Response) {
    const csv = await this.profile.exportMembers(lang);
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="membres-lelou-solidarity-${date}.csv"`);
    res.setHeader('Cache-Control', 'no-store');
    return csv;
  }
}
