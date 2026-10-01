//backend/src/mail/mail.service.ts
// v1.4 — le logo (<FRONTEND_URL>/logo.png, fichier web/public/logo.png) est
// transmis aux gabarits pour apparaître dans l'en-tête de chaque e-mail.
// v1.3 — le lien « Remplir le formulaire » de l'e-mail du code d'accès
// contient maintenant le code (/formulaire?code=XXXX) : le formulaire le
// pré-remplit et le verrouille automatiquement.
// v1.2 — FRONTEND_URL lu et validé via resolveFrontendUrl() (une seule
// adresse, sans "/" final) : évite les liens cassés dans les e-mails.
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { resolveFrontendUrl } from '../common/frontend-url';
import {
  accessCodeEmail,
  cardExpiredEmail,
  cardReadyEmail,
  expirationReminderEmail,
  resetPasswordEmail,
  submissionReceivedEmail,
} from './templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly from: string;
  private readonly frontendUrl: string;
  private readonly logoUrl: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.from = this.config.get<string>('MAIL_FROM', 'LELOU SOLIDARITY <no-reply@example.org>');
    this.frontendUrl = resolveFrontendUrl(this.config.get<string>('FRONTEND_URL'));
    this.logoUrl = `${this.frontendUrl}/logo.png`;
  }

  async sendAccessCode(email: string, code: string) {
    // Le code est ajouté à l'adresse pour que le formulaire se remplisse seul
    const formUrl = `${this.frontendUrl}/formulaire?code=${encodeURIComponent(code)}`;
    return this.send(email, 'Votre code d’accès LELOU SOLIDARITY', accessCodeEmail(code, formUrl, this.logoUrl));
  }

  async sendPasswordReset(email: string, name: string, token: string) {
    const resetUrl = `${this.frontendUrl}/admin/reset-password/${token}`;
    return this.send(
      email,
      'Réinitialisation de mot de passe - LELOU SOLIDARITY',
      resetPasswordEmail(name, resetUrl, this.logoUrl),
    );
  }

  async sendSubmissionReceived(email: string, firstName: string) {
    return this.send(email, 'Demande reçue - LELOU SOLIDARITY', submissionReceivedEmail(firstName, this.logoUrl));
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
      cardReadyEmail(firstName, memberCode, formatDate(expiresAt), this.logoUrl),
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
      'Votre carte arrive à expiration - LELOU SOLIDARITY',
      expirationReminderEmail(firstName, formatDate(expiresAt), this.logoUrl),
    );
  }

  async sendCardExpired(email: string, firstName: string) {
    return this.send(email, 'Votre carte a expiré - LELOU SOLIDARITY', cardExpiredEmail(firstName, this.logoUrl));
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
        // Le SDK Resend ne lève JAMAIS d'exception sur une erreur API
        // (403, domaine non vérifié, destinataire refusé...) : il renvoie
        // { data: null, error }. Sans cette vérification explicite,
        // l'échec d'envoi passe totalement inaperçu.
        throw new Error(error.message || 'Échec d’envoi via Resend');
      }

      return data;
    } catch (err) {
      this.logger.error(`Échec d'envoi d'e-mail à ${to}: ${(err as Error).message}`);
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