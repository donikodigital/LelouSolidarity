//backend/src/mail/mail.service.ts
// v1.7 — chaque envoi reçoit la langue du destinataire (objets, gabarits, dates, nom du PDF).
// v1.6 — sendFormRequestNotification() : prévient les administrateurs d'une
// demande de formulaire (reply-to = adresse du membre).
// v1.5 — l'e-mail d'accès n'affiche plus le code : il reste uniquement dans le
// lien du bouton (/formulaire?code=XXXX). Nouvel objet d'e-mail.
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
import { DEFAULT_LOCALE, Locale, formatLongDate } from '../common/i18n';
import {
  accessCodeEmail,
  cardExpiredEmail,
  cardReadyEmail,
  expirationReminderEmail,
  formRequestEmail,
  resetPasswordEmail,
  submissionReceivedEmail,
} from './templates';

const SUBJECTS: Record<Locale, Record<string, string>> = {
  fr: {
    access: 'Votre accès au formulaire d’adhésion - LELOU SOLIDARITY',
    reset: 'Réinitialisation de mot de passe - LELOU SOLIDARITY',
    received: 'Demande reçue - LELOU SOLIDARITY',
    cardReady: 'Votre carte de membre LELOU SOLIDARITY',
    reminder: 'Votre carte arrive à expiration - LELOU SOLIDARITY',
    expired: 'Votre carte a expiré - LELOU SOLIDARITY',
    formRequest: 'Nouvelle demande de formulaire',
  },
  en: {
    access: 'Your access to the membership form - LELOU SOLIDARITY',
    reset: 'Password reset - LELOU SOLIDARITY',
    received: 'Request received - LELOU SOLIDARITY',
    cardReady: 'Your LELOU SOLIDARITY membership card',
    reminder: 'Your card is about to expire - LELOU SOLIDARITY',
    expired: 'Your card has expired - LELOU SOLIDARITY',
    formRequest: 'New form request',
  },
  // Pular (Fuuta Jallon) — à faire relire
  ff: {
    access: 'Lien maaɗa ngam formulaire naatugo - LELOU SOLIDARITY',
    reset: 'Sanjugo sirru - LELOU SOLIDARITY',
    received: 'Ƴamol hebaama - LELOU SOLIDARITY',
    cardReady: 'Karte maaɗa kawtaaɗo LELOU SOLIDARITY',
    reminder: 'Karte maaɗa ɗon hesɗitina - LELOU SOLIDARITY',
    expired: 'Karte maaɗa timmii - LELOU SOLIDARITY',
    formRequest: 'Ƴamol formulaire kesol',
  },
};

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

  async sendAccessCode(email: string, code: string, locale: Locale = DEFAULT_LOCALE) {
    // Le code est ajouté à l'adresse pour que le formulaire se remplisse seul ;
    // « lang » fait s'ouvrir le site dans la langue de l'e-mail.
    const formUrl = `${this.frontendUrl}/formulaire?code=${encodeURIComponent(code)}&lang=${locale}`;
    return this.send(
      email,
      SUBJECTS[locale].access,
      accessCodeEmail(formUrl, this.logoUrl, locale),
    );
  }

  async sendPasswordReset(email: string, name: string, token: string, locale: Locale = DEFAULT_LOCALE) {
    const resetUrl = `${this.frontendUrl}/admin/reset-password/${token}?lang=${locale}`;
    return this.send(
      email,
      SUBJECTS[locale].reset,
      resetPasswordEmail(name, resetUrl, this.logoUrl, locale),
    );
  }

  async sendSubmissionReceived(email: string, firstName: string, locale: Locale = DEFAULT_LOCALE) {
    return this.send(
      email,
      SUBJECTS[locale].received,
      submissionReceivedEmail(firstName, this.logoUrl, locale),
    );
  }

  async sendCardReady(
    email: string,
    firstName: string,
    memberCode: string,
    expiresAt: Date,
    pdfBuffer: Buffer,
    locale: Locale = DEFAULT_LOCALE,
  ) {
    return this.send(
      email,
      SUBJECTS[locale].cardReady,
      cardReadyEmail(firstName, memberCode, formatLongDate(expiresAt, locale), this.logoUrl, locale),
      [
        {
          filename: `${locale === 'en' ? 'membership-card' : locale === 'ff' ? 'karte-kawtaado' : 'carte-membre'}-${memberCode}.pdf`,
          content: pdfBuffer.toString('base64'),
        },
      ],
    );
  }

  async sendExpirationReminder(
    email: string,
    firstName: string,
    expiresAt: Date,
    locale: Locale = DEFAULT_LOCALE,
  ) {
    return this.send(
      email,
      SUBJECTS[locale].reminder,
      expirationReminderEmail(firstName, formatLongDate(expiresAt, locale), this.logoUrl, locale),
    );
  }

  /**
   * Prévient les administrateurs qu'un futur membre demande son formulaire.
   * L'e-mail est rédigé dans la langue des administrateurs (français par défaut) ;
   * la langue choisie par le demandeur y est indiquée.
   */
  async sendFormRequestNotification(
    to: string[],
    request: {
      firstName: string;
      lastName: string;
      city: string;
      state: string;
      country: string;
      email: string;
      phone: string;
      message: string;
      locale?: string;
    },
    adminLocale: Locale = DEFAULT_LOCALE,
  ) {
    const adminUrl = `${this.frontendUrl}/admin/demandes?lang=${adminLocale}`;
    // Pas de saut de ligne dans l'objet (valeurs saisies par un visiteur)
    const name = `${request.firstName} ${request.lastName}`.replace(/[\r\n]+/g, ' ').trim();
    return this.send(
      to,
      `${SUBJECTS[adminLocale].formRequest} - ${name}`,
      formRequestEmail(request, adminUrl, this.logoUrl, adminLocale),
      undefined,
      { replyTo: request.email },
    );
  }

  async sendCardExpired(email: string, firstName: string, locale: Locale = DEFAULT_LOCALE) {
    return this.send(
      email,
      SUBJECTS[locale].expired,
      cardExpiredEmail(firstName, this.logoUrl, locale),
    );
  }

  private async send(
    to: string | string[],
    subject: string,
    html: string,
    attachments?: { filename: string; content: string }[],
    options?: { replyTo?: string },
  ) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
        attachments,
        replyTo: options?.replyTo,
      });

      if (error) {
        // Le SDK Resend ne lève JAMAIS d'exception sur une erreur API
        // (403, domaine non vérifié, destinataire refusé...) : il renvoie
        // { data: null, error }. Sans cette vérification explicite,
        // l'échec d'envoi passe totalement inaperçu.
        throw new Error(error.message || 'Resend send failure');
      }

      return data;
    } catch (err) {
      this.logger.error(`Échec d'envoi d'e-mail à ${Array.isArray(to) ? to.join(', ') : to}: ${(err as Error).message}`);
      throw err;
    }
  }
}
