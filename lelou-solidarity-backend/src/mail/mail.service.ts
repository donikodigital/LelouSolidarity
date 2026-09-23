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
  private readonly resend: Resend | null;
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.resend = null;
      this.logger.warn(
        'RESEND_API_KEY non definie : les emails ne seront pas envoyes (mode desactive).',
      );
    }

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
    if (!this.resend) {
      this.logger.warn(`Email a ${to} ("${subject}") ignore : Resend desactive.`);
      return null;
    }

    try {
      return await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
        attachments,
      });
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