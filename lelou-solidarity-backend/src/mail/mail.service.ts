import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  accessCodeEmail,
  cardExpiredEmail,
  cardReadyEmail,
  expirationReminderEmail,
  submissionReceivedEmail,
} from './templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.from = this.config.get<string>('MAIL_FROM', 'LELOU SOLIDARITY <no-reply@example.org>');
    this.frontendUrl = this.config.get<string>('FRONTEND_URL', '');
  }

  async sendAccessCode(email: string, code: string) {
    const formUrl = `${this.frontendUrl}/formulaire`;
    return this.send(email, 'Votre code d\u2019acces LELOU SOLIDARITY', accessCodeEmail(code, formUrl));
  }

  async sendSubmissionReceived(email: string, firstName: string) {
    return this.send(email, 'Demande recue - LELOU SOLIDARITY', submissionReceivedEmail(firstName));
  }

  async sendCardReady(
    email: string,
    firstName: string,
    memberCode: string,
    expiresAt: Date,
    pdfBuffer: Buffer,
  ) {
    return this.send(
      email,
      'Votre carte de membre LELOU SOLIDARITY',
      cardReadyEmail(firstName, memberCode, formatDate(expiresAt)),
      [
        {
          filename: `carte-membre-${memberCode}.pdf`,
          content: pdfBuffer.toString('base64'),
        },
      ],
    );
  }

  async sendExpirationReminder(email: string, firstName: string, expiresAt: Date) {
    return this.send(
      email,
      'Votre carte arrive a expiration - LELOU SOLIDARITY',
      expirationReminderEmail(firstName, formatDate(expiresAt)),
    );
  }

  async sendCardExpired(email: string, firstName: string) {
    return this.send(email, 'Votre carte a expire - LELOU SOLIDARITY', cardExpiredEmail(firstName));
  }

  private async send(
    to: string,
    subject: string,
    html: string,
    attachments?: { filename: string; content: string }[],
  ) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
        attachments,
      });

      if (error) {
        // Le SDK Resend ne leve JAMAIS d'exception sur une erreur API
        // (403, domaine non verifie, destinataire refuse...) : il renvoie
        // { data: null, error }. Sans cette verification explicite,
        // l'echec d'envoi passe totalement inapercu.
        throw new Error(error.message || "Echec d'envoi via Resend");
      }

      return data;
    } catch (err) {
      this.logger.error(`Echec d'envoi d'e-mail a ${to}: ${(err as Error).message}`);
      throw err;
    }
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}