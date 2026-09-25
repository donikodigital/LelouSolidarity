import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';

// Endpoint public appele quand quelqu'un scanne le QR code d'une carte.
// Le statut est toujours recalcule a la volee (jamais uniquement lu tel
// quel en base) pour rester exact meme si la tache planifiee quotidienne
// n'est pas encore passee.
@Controller('public/verify')
export class VerifyController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':token')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async verify(@Param('token') token: string) {
    const member = await this.prisma.member.findUnique({ where: { verifyToken: token } });

    if (!member || !member.memberCode) {
      throw new NotFoundException('Carte introuvable.');
    }

    const now = new Date();
    const isExpired = member.cardExpiresAt ? member.cardExpiresAt < now : true;
    const status = isExpired ? 'EXPIRED' : member.cardStatus;

    return {
      valid: true,
      status,
      memberCode: member.memberCode,
      fullName: `${member.firstName} ${member.lastName}`,
      originDistrict: member.originDistrict,
      residence: `${member.city}, ${member.state}`,
      issuedAt: member.cardIssuedAt,
      expiresAt: member.cardExpiresAt,
    };
  }
}
