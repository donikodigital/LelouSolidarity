import { Injectable } from '@nestjs/common';
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
      throw new Error("Impossible de generer un code d'acces unique, reessaie.");
    }

    await this.mail.sendAccessCode(accessCode.email, accessCode.code);

    return { id: accessCode.id, email: accessCode.email, code: accessCode.code };
  }

  async list() {
    return this.prisma.accessCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: { member: { select: { id: true, firstName: true, lastName: true } } },
    });
  }
}
