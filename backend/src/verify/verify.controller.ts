//backend/src/verify/verify.controller.ts
// v1.1 — renvoie aussi la photo du membre (version réduite 400 x 490 px, comme
// sur la carte) pour que la personne qui contrôle compare le visage du porteur
// avec la photo enregistrée. `photoFallbackUrl` = photo d'origine, utilisée par
// la page si la version réduite n'est pas disponible.
import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';

// Même recadrage que la photo imprimée sur la carte (cadre 20 x 24,5 mm).
const PHOTO_TRANSFORM = 'c_fill,g_auto,w_400,h_490,q_auto:good,f_jpg';

/** Adresse Cloudinary de la version réduite ; renvoie l'adresse d'origine si ce n'est pas du Cloudinary. */
function optimizedPhotoUrl(original: string | null | undefined): string | null {
  if (!original || !original.trim()) return null;
  const marker = '/image/upload/';
  const index = original.indexOf(marker);
  if (!original.includes('res.cloudinary.com') || index === -1) return original;
  return `${original.slice(0, index + marker.length)}${PHOTO_TRANSFORM}/${original.slice(index + marker.length)}`;
}

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

    const photoUrl = optimizedPhotoUrl(member.photoUrl);
    const original = member.photoUrl && member.photoUrl.trim() ? member.photoUrl : null;

    return {
      valid: true,
      status,
      memberCode: member.memberCode,
      fullName: `${member.firstName} ${member.lastName}`,
      originDistrict: member.originDistrict,
      residence: `${member.city}, ${member.state}`,
      issuedAt: member.cardIssuedAt,
      expiresAt: member.cardExpiresAt,
      photoUrl,
      photoFallbackUrl: original && original !== photoUrl ? original : null,
    };
  }
}