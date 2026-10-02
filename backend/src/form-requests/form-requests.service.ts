//backend/src/form-requests/form-requests.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AccessCodesService } from '../access-codes/access-codes.service';
import { CreateFormRequestDto } from './dto/create-form-request.dto';

// Message type enregistré avec chaque demande (le membre ne peut pas le modifier :
// il est fixé côté serveur et affiché tel quel à l'administrateur).
export const FORM_REQUEST_MESSAGE =
  'Bonjour, je me permets de vous demander de m’envoyer mon formulaire d’adhésion de Lelou Solidarity afin que je puisse obtenir ma carte de membre. Vous trouverez mes informations personnelles ci-jointes.';

@Injectable()
export class FormRequestsService {
  private readonly logger = new Logger(FormRequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly accessCodes: AccessCodesService,
  ) {}

  /**
   * Demande publique d'un futur membre. Enregistre la demande puis prévient
   * tous les administrateurs par e-mail. L'échec de l'e-mail n'est pas fatal :
   * la demande reste visible dans l'espace admin.
   */
  async create(dto: CreateFormRequestDto): Promise<{ ok: true }> {
    // Champ piège rempli : c'est un robot. On répond « ok » sans rien enregistrer.
    if (dto.website && dto.website.trim() !== '') {
      this.logger.warn('Demande de formulaire ignorée (champ piège rempli).');
      return { ok: true };
    }

    const email = dto.email.toLowerCase().trim();

    // Une demande est déjà en attente pour cette adresse : pas de doublon,
    // pas de nouvel e-mail à l'administrateur.
    const existing = await this.prisma.formRequest.findFirst({
      where: { email, handled: false },
      select: { id: true },
    });
    if (existing) return { ok: true };

    const request = await this.prisma.formRequest.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        city: dto.city.trim(),
        email,
        phone: dto.phone.trim(),
        message: FORM_REQUEST_MESSAGE,
      },
    });

    try {
      const admins = await this.prisma.admin.findMany({ select: { email: true } });
      const recipients = admins.map((a) => a.email);
      if (recipients.length > 0) {
        await this.mail.sendFormRequestNotification(recipients, request);
      }
    } catch (err) {
      this.logger.error(
        `Échec de l'e-mail de notification (demande de ${email}): ${(err as Error).message}`,
      );
    }

    return { ok: true };
  }

  list() {
    return this.prisma.formRequest.findMany({ orderBy: { createdAt: 'desc' } });
  }

  /**
   * Envoie au membre un lien d'accès au formulaire (même mécanisme que
   * « Envoyer un nouveau code ») puis marque la demande comme traitée.
   * Si l'envoi échoue, l'erreur remonte et la demande reste « à traiter ».
   */
  async sendForm(id: string) {
    const request = await this.findOneOrThrow(id);
    await this.accessCodes.generateAndSend(request.email);
    return this.prisma.formRequest.update({
      where: { id },
      data: { handled: true, handledAt: new Date() },
    });
  }

  /** Marque la demande comme traitée sans rien envoyer (ex. traitée par téléphone). */
  async markHandled(id: string) {
    await this.findOneOrThrow(id);
    return this.prisma.formRequest.update({
      where: { id },
      data: { handled: true, handledAt: new Date() },
    });
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    await this.prisma.formRequest.delete({ where: { id } });
    return { id };
  }

  private async findOneOrThrow(id: string) {
    const request = await this.prisma.formRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException('Demande introuvable.');
    }
    return request;
  }
}