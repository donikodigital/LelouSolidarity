import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { passwordFingerprint } from '../password-fingerprint';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; pv?: string; iat?: number }) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
    });
    if (!admin) {
      throw new UnauthorizedException('Compte administrateur introuvable');
    }
    // Mot de passe changé depuis l'émission du jeton : session invalide.
    if (payload.pv !== passwordFingerprint(admin.passwordHash)) {
      throw new UnauthorizedException('Session expirée, merci de vous reconnecter');
    }
    // « Se déconnecter de tous les appareils » : les jetons émis avant ce moment sont refusés
    // (comparaison à la seconde près, c'est la précision de la date d'émission du jeton).
    if (
      admin.sessionsRevokedAt &&
      (payload.iat ?? 0) < Math.floor(admin.sessionsRevokedAt.getTime() / 1000)
    ) {
      throw new UnauthorizedException('Session expirée, merci de vous reconnecter');
    }
    return { sub: admin.id, email: admin.email };
  }
}
