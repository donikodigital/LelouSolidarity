import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async login(dto: LoginDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!admin) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const valid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const accessToken = await this.jwt.signAsync({
      sub: admin.id,
      email: admin.email,
    });

    return {
      accessToken,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    };
  }

  async requestPasswordReset(dto: ForgotPasswordDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    // Reponse volontairement identique que l'email existe ou non,
    // pour ne pas laisser deviner quels comptes admin existent.
    const genericMessage = 'Si un compte existe avec cet e-mail, un lien de reinitialisation a ete envoye.';
    if (!admin) return { message: genericMessage };

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { resetToken: token, resetTokenExpiresAt: expiresAt },
    });

    await this.mail.sendPasswordReset(admin.email, admin.name || 'Administrateur', token);

    return { message: genericMessage };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const admin = await this.prisma.admin.findFirst({ where: { resetToken: dto.token } });

    if (!admin || !admin.resetTokenExpiresAt || admin.resetTokenExpiresAt < new Date()) {
      throw new BadRequestException('Ce lien de reinitialisation est invalide ou a expire.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
    });

    return { message: 'Mot de passe mis a jour avec succes.' };
  }
}