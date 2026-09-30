//backend/src/access-codes/access-codes.service.ts
// v1.3 — remove() : un code "utilise" dont le membre a ete supprime peut
// desormais etre supprime lui aussi (avant, il restait bloque a vie).
// v1.2 — si l'envoi Resend echoue : suppression du code fantome
// fraichement cree + remontee du message d'erreur reel de Resend a
// l'administrateur (au lieu d'un 500 generique qui masquait la cause).
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { generateAccessCode } from './utils/code-generator';

@Injectable()
export class AccessCodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /**
   * Cree un nouveau code d'acces pour un membre et le lui envoie par e-mail.
   * Reessaie en cas (tres improbable) de collision sur le code genere.
   */
  async generateAndSend(email: string) {
    let accessCode: { id: string; code: string; email: string } | null = null;

    for (let attempt = 0; attempt < 5 && !accessCode; attempt++) {
      const code = generateAccessCode(8);
      try {
        accessCode = await this.prisma.accessCode.create({
          data: { code, email: email.toLowerCase().trim() },
        });
      } catch (err: any) {
        if (err?.code !== 'P2002') throw err; // relance si ce n'est pas une collision d'unicite
      }
    }

    if (!accessCode) {
      throw new BadRequestException("Impossible de generer un code d'acces unique, reessaie.");
    }

    try {
      await this.mail.sendAccessCode(accessCode.email, accessCode.code);
    } catch (err) {
      // L'envoi a echoue : on supprime le code fantome (jamais recu par
      // personne) au lieu de le laisser trainer en base comme "En attente",
      // et on remonte le vrai message Resend a l'admin pour diagnostic direct.
      await this.prisma.accessCode.delete({ where: { id: accessCode.id } }).catch(() => undefined);
      throw new BadRequestException(
        `Le code n'a pas pu etre envoye par e-mail : ${(err as Error).message}`,
      );
    }

    return { id: accessCode.id, email: accessCode.email, code: accessCode.code };
  }

  async list() {
    return this.prisma.accessCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: { member: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  /** Modifie l'adresse e-mail d'un code pas encore utilise. */
  async update(id: string, email?: string) {
    const accessCode = await this.prisma.accessCode.findUnique({ where: { id } });
    if (!accessCode) {
      throw new NotFoundException("Code d'acces introuvable.");
    }
    if (accessCode.used) {
      throw new BadRequestException("Impossible de modifier un code deja utilise par un membre.");
    }

    return this.prisma.accessCode.update({
      where: { id },
      data: email ? { email: email.toLowerCase().trim() } : {},
    });
  }

  /**
   * Supprime un code d'acces. Refuse uniquement si un membre y est encore
   * rattache : un code utilise dont le membre a ete supprime est "orphelin"
   * et peut etre nettoye.
   */
  async remove(id: string) {
    const accessCode = await this.prisma.accessCode.findUnique({
      where: { id },
      include: { member: { select: { id: true } } },
    });
    if (!accessCode) {
      throw new NotFoundException("Code d'acces introuvable.");
    }
    if (accessCode.member) {
      throw new BadRequestException("Impossible de supprimer un code deja utilise par un membre.");
    }

    await this.prisma.accessCode.delete({ where: { id } });
    return { id };
  }
}