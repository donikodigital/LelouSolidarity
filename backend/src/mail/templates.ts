//backend/src/mail/templates.ts
// Gabarits d'e-mails en HTML simple (compatible avec la plupart des clients
// mail). Les couleurs viennent de src/common/theme.ts - un seul endroit à
// modifier pour tout répercuter (carte + e-mails).
// v1.7 — Pular (ff) ajouté ; v1.6 — e-mails en français et en anglais : chaque gabarit reçoit la langue du
// destinataire (`locale`, voir common/i18n.ts). Les textes sont dans l'objet TEXTS.
// v1.5 — nouvel e-mail destiné aux administrateurs : demande de formulaire
// d'adhésion faite depuis la page d'accueil (formRequestEmail).
// v1.4 — e-mail d'accès : le code n'est plus affiché (il est contenu dans le
// lien du bouton) ; le message précise que le lien est à usage unique.
// v1.3 — logo de l'association dans l'en-tête de chaque e-mail (image
// hébergée : <FRONTEND_URL>/logo.png, fournie en paramètre `logoUrl`) et
// liseré or sous l'en-tête.
// v1.2 — e-mail du code d'accès : le bouton ouvre le formulaire avec le code
// déjà renseigné (plus besoin de le recopier).
// v1.1 — les valeurs saisies par les utilisateurs (prénom, nom...) sont
// échappées avant d'être insérées dans le HTML.
import { THEME } from '../common/theme';
import { Locale, parseLocale } from '../common/i18n';

/** Neutralise le HTML dans une valeur saisie par un utilisateur. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type Dict = {
  footer: string;
  logoAlt: string;
  hello: string; // « Bonjour, »
  helloName: (name: string) => string;
  access: {
    title: string;
    p1: string;
    p2: string;
    button: string;
    note: string;
  };
  received: { title: string; p1: string; p2: string };
  cardReady: {
    title: string;
    p1: (code: string) => string;
    p2: (date: string) => string;
    p3: string;
  };
  reminder: { title: string; p1: (date: string) => string; p2: string };
  expired: { title: string; p1: string; p2: string };
  reset: { title: string; p1: string; button: string; note: string };
  formRequest: {
    title: string;
    p1: string;
    firstName: string;
    lastName: string;
    city: string;
    state: string;
    country: string;
    email: string;
    phone: string;
    language: string;
    button: string;
    note: string;
  };
};

const TEXTS: Record<Locale, Dict> = {
  fr: {
    footer: `${THEME.associationName} &mdash; association des ressortissants de Lelouma aux États-Unis`,
    logoAlt: `Logo ${THEME.associationName}`,
    hello: 'Bonjour,',
    helloName: (name) => `Bonjour ${escapeHtml(name)},`,
    access: {
      title: 'Votre accès au formulaire d’adhésion',
      p1: `Nous avons le plaisir de vous inviter à remplir votre formulaire d'adhésion à <strong>${THEME.associationName}</strong>.`,
      p2: "Cliquez sur le bouton ci-dessous pour y accéder : votre accès personnel est déjà activé, vous n'avez aucun code à saisir.",
      button: 'Remplir le formulaire',
      note: "Ce lien est personnel et ne peut être utilisé qu'une seule fois : ne le partagez pas. Une fois votre demande envoyée, il ne permettra plus d'ouvrir le formulaire.",
    },
    received: {
      title: 'Demande bien reçue',
      p1: "Nous avons bien reçu vos informations. Votre carte de membre est en cours de traitement par l'administrateur de l'association et vous sera envoyée par e-mail dès qu'elle sera prête.",
      p2: 'Merci pour votre confiance.',
    },
    cardReady: {
      title: 'Votre carte de membre est prête',
      p1: (code) =>
        `Votre carte de membre <strong>${escapeHtml(code)}</strong> est prête et jointe à cet e-mail au format PDF.`,
      p2: (date) =>
        `Elle est valable jusqu'au <strong>${escapeHtml(date)}</strong>. Nous vous recommandons de l'imprimer et de la faire plastifier.`,
      p3: "Un QR code figure sur la carte : il permet à tout moment de vérifier son authenticité et son statut.",
    },
    reminder: {
      title: 'Votre carte de membre arrive bientôt à expiration',
      p1: (date) => `Votre carte de membre arrivera à expiration le <strong>${escapeHtml(date)}</strong>.`,
      p2: "Merci de contacter le trésorier de l'association pour régulariser votre cotisation et permettre le renouvellement de votre carte.",
    },
    expired: {
      title: 'Votre carte de membre a expiré',
      p1: "Votre carte de membre est arrivée à expiration aujourd'hui.",
      p2: "Merci de vous rapprocher du trésorier de l'association pour régulariser votre cotisation ; votre carte sera alors renouvelée.",
    },
    reset: {
      title: 'Réinitialisation de votre mot de passe',
      p1: `Vous avez demandé la réinitialisation de votre mot de passe administrateur pour <strong>${THEME.associationName}</strong>.`,
      button: 'Réinitialiser mon mot de passe',
      note: "Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
    },
    formRequest: {
      title: 'Nouvelle demande de formulaire d’adhésion',
      p1: "Un futur membre demande l'envoi de son formulaire d'adhésion :",
      firstName: 'Prénom',
      lastName: 'Nom',
      city: 'Ville de résidence',
      state: 'État',
      country: 'Pays',
      email: 'E-mail',
      phone: 'Téléphone',
      language: 'Langue choisie',
      button: 'Ouvrir la demande',
      note: 'Vous pouvez aussi répondre directement à cet e-mail : votre réponse sera adressée au membre.',
    },
  },
  en: {
    footer: `${THEME.associationName} &mdash; association of Lelouma natives in the United States`,
    logoAlt: `${THEME.associationName} logo`,
    hello: 'Hello,',
    helloName: (name) => `Hello ${escapeHtml(name)},`,
    access: {
      title: 'Your access to the membership form',
      p1: `We are pleased to invite you to fill in your membership form for <strong>${THEME.associationName}</strong>.`,
      p2: "Click the button below to access it: your personal access is already activated, you don't need to enter any code.",
      button: 'Fill in the form',
      note: 'This link is personal and can only be used once: please do not share it. Once your request is sent, it will no longer open the form.',
    },
    received: {
      title: 'Request received',
      p1: "We have received your information. Your membership card is being processed by the association's administrator and will be sent to you by e-mail as soon as it is ready.",
      p2: 'Thank you for your trust.',
    },
    cardReady: {
      title: 'Your membership card is ready',
      p1: (code) =>
        `Your membership card <strong>${escapeHtml(code)}</strong> is ready and attached to this e-mail as a PDF.`,
      p2: (date) =>
        `It is valid until <strong>${escapeHtml(date)}</strong>. We recommend printing it and having it laminated.`,
      p3: 'A QR code is printed on the card: it lets anyone verify its authenticity and status at any time.',
    },
    reminder: {
      title: 'Your membership card is about to expire',
      p1: (date) => `Your membership card will expire on <strong>${escapeHtml(date)}</strong>.`,
      p2: "Please contact the association's treasurer to settle your membership fee so that your card can be renewed.",
    },
    expired: {
      title: 'Your membership card has expired',
      p1: 'Your membership card expired today.',
      p2: "Please contact the association's treasurer to settle your membership fee; your card will then be renewed.",
    },
    reset: {
      title: 'Reset your password',
      p1: `You requested a password reset for your administrator account at <strong>${THEME.associationName}</strong>.`,
      button: 'Reset my password',
      note: 'This link expires in 1 hour. If you did not make this request, please ignore this e-mail.',
    },
    formRequest: {
      title: 'New membership form request',
      p1: 'A future member is asking for their membership form to be sent:',
      firstName: 'First name',
      lastName: 'Last name',
      city: 'City of residence',
      state: 'State',
      country: 'Country',
      email: 'E-mail',
      phone: 'Phone',
      language: 'Chosen language',
      button: 'Open the request',
      note: 'You can also reply directly to this e-mail: your reply will be sent to the member.',
    },
  },
  // Pular (Fuuta Jallon) — première version à faire relire par un locuteur.
  // Les e-mails destinés aux administrateurs (reset, formRequest) restent en français.
  ff: {
    footer: `${THEME.associationName} &mdash; kawtal Leloomaaɓe e Ameriki`,
    logoAlt: `Logo ${THEME.associationName}`,
    hello: 'Assalaamu alaykum,',
    helloName: (name) => `Assalaamu alaykum ${escapeHtml(name)},`,
    access: {
      title: 'Lien maaɗa ngam formulaire naatugo',
      p1: `Min ɗon ngaddana ma ngam winndugo formulaire naatugo maaɗa e <strong>${THEME.associationName}</strong>.`,
      p2: 'Taɓɓu buutoŋ ngon les ngam naatugo: lien maaɗa ɗon hesɗitinaama, a ɗoon haani winndugo kodo.',
      button: 'Winndu e formulaire',
      note: 'Lien ngoo ko maaɗa tan e huutinaama nde gooto tan: taa hokku ngoo goɗɗo. Ɓaawo neldugo ƴamol maaɗa, ngoo waawataa maɓɓugo formulaire fahin.',
    },
    received: {
      title: 'Ƴamol hebaama',
      p1: 'Min hebii ko winndu maaɗa. Administrateur kawtal ɗon taaskude karte maaɗa kawtaaɗo, maa nelda ma ɗum e imeel ndeen ɗum timmi.',
      p2: 'A jaaraama ngam hoolaare maaɗa.',
    },
    cardReady: {
      title: 'Karte maaɗa kawtaaɗo timmii',
      p1: (code) =>
        `Karte maaɗa kawtaaɗo <strong>${escapeHtml(code)}</strong> timmii e jokkaama e imeel ɗoo (PDF).`,
      p2: (date) =>
        `Ɗum ɗon huuwa haa <strong>${escapeHtml(date)}</strong>. Min cikki a hawta ɗum e a ɓoora ɗum.`,
      p3: 'QR code woni e karte ndee: ɗum waawi hoolaago karte ndee e nde ɗon huuwi, fuu nde.',
    },
    reminder: {
      title: 'Karte maaɗa kawtaaɗo ɗon hesɗitina',
      p1: (date) => `Karte maaɗa kawtaaɗo maa timma nde <strong>${escapeHtml(date)}</strong>.`,
      p2: 'Tiiɗno, ɗaɓɓu trésorier kawtal ngam yoɓugo cotisation maaɗa, karte maaɗa hesɗitinee.',
    },
    expired: {
      title: 'Karte maaɗa kawtaaɗo timmii',
      p1: 'Karte maaɗa kawtaaɗo timmii hannde.',
      p2: 'Tiiɗno, ɗaɓɓu trésorier kawtal ngam yoɓugo cotisation maaɗa, karte maaɗa hesɗitinee.',
    },
    // E-mail administrateur : français
    reset: {
      title: 'Réinitialisation de votre mot de passe',
      p1: `Vous avez demandé la réinitialisation de votre mot de passe administrateur pour <strong>${THEME.associationName}</strong>.`,
      button: 'Réinitialiser mon mot de passe',
      note: "Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
    },
    // E-mail administrateur : français
    formRequest: {
      title: 'Nouvelle demande de formulaire d’adhésion',
      p1: "Un futur membre demande l'envoi de son formulaire d'adhésion :",
      firstName: 'Prénom',
      lastName: 'Nom',
      city: 'Ville de résidence',
      state: 'État',
      country: 'Pays',
      email: 'E-mail',
      phone: 'Téléphone',
      language: 'Langue choisie',
      button: 'Ouvrir la demande',
      note: 'Vous pouvez aussi répondre directement à cet e-mail : votre réponse sera adressée au membre.',
    },
  },
};

const LANGUAGE_NAMES: Record<Locale, Record<Locale, string>> = {
  fr: { fr: 'Français', en: 'Anglais', ff: 'Pular' },
  en: { fr: 'French', en: 'English', ff: 'Pular' },
  ff: { fr: 'Français', en: 'Anglais', ff: 'Pular' },
};

function layout(title: string, bodyHtml: string, logoUrl: string, locale: Locale): string {
  const t = TEXTS[locale];
  return `
  <div style="background:#F2F5F7;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <div style="background-color:${THEME.primaryDark};background-image:linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark});padding:22px 28px;border-bottom:3px solid ${THEME.accentGold};">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-right:14px;vertical-align:middle;">
              <img src="${escapeHtml(logoUrl)}" width="54" height="54" alt="${t.logoAlt}" style="display:block;width:54px;height:54px;border-radius:50%;border:2px solid ${THEME.accentGold};background:#FFFFFF;" />
            </td>
            <td style="vertical-align:middle;">
              <p style="margin:0;color:#FFFFFF;font-size:20px;font-weight:bold;letter-spacing:0.5px;">
                ${THEME.associationName}
              </p>
            </td>
          </tr>
        </table>
      </div>
      <div style="padding:28px;color:#233241;font-size:15px;line-height:1.6;">
        <h1 style="font-size:19px;color:${THEME.primaryDark};margin:0 0 16px;">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:16px 28px;background:#F7FAFC;color:#8AA0AE;font-size:12px;border-top:1px solid #E6EEF2;">
        ${t.footer}
      </div>
    </div>
  </div>`;
}

const BUTTON_STYLE = `background:${THEME.primary};color:#FFFFFF;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:bold;display:inline-block;border-bottom:3px solid ${THEME.accentGold};`;

export function accessCodeEmail(formUrl: string, logoUrl: string, locale: Locale = 'fr') {
  const t = TEXTS[locale];
  return layout(
    t.access.title,
    `
      <p>${t.hello}</p>
      <p>${t.access.p1}</p>
      <p>${t.access.p2}</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${escapeHtml(formUrl)}" style="${BUTTON_STYLE}">
          ${t.access.button}
        </a>
      </p>
      <p style="color:#8AA0AE;font-size:13px;">${t.access.note}</p>
    `,
    logoUrl,
    locale,
  );
}

export function submissionReceivedEmail(firstName: string, logoUrl: string, locale: Locale = 'fr') {
  const t = TEXTS[locale];
  return layout(
    t.received.title,
    `
      <p>${t.helloName(firstName)}</p>
      <p>${t.received.p1}</p>
      <p>${t.received.p2}</p>
    `,
    logoUrl,
    locale,
  );
}

export function cardReadyEmail(
  firstName: string,
  memberCode: string,
  expiresAt: string,
  logoUrl: string,
  locale: Locale = 'fr',
) {
  const t = TEXTS[locale];
  return layout(
    t.cardReady.title,
    `
      <p>${t.helloName(firstName)}</p>
      <p>${t.cardReady.p1(memberCode)}</p>
      <p>${t.cardReady.p2(expiresAt)}</p>
      <p>${t.cardReady.p3}</p>
    `,
    logoUrl,
    locale,
  );
}

export function expirationReminderEmail(
  firstName: string,
  expiresAt: string,
  logoUrl: string,
  locale: Locale = 'fr',
) {
  const t = TEXTS[locale];
  return layout(
    t.reminder.title,
    `
      <p>${t.helloName(firstName)}</p>
      <p>${t.reminder.p1(expiresAt)}</p>
      <p>${t.reminder.p2}</p>
    `,
    logoUrl,
    locale,
  );
}

export function cardExpiredEmail(firstName: string, logoUrl: string, locale: Locale = 'fr') {
  const t = TEXTS[locale];
  return layout(
    t.expired.title,
    `
      <p>${t.helloName(firstName)}</p>
      <p>${t.expired.p1}</p>
      <p>${t.expired.p2}</p>
    `,
    logoUrl,
    locale,
  );
}

export function resetPasswordEmail(
  name: string,
  resetUrl: string,
  logoUrl: string,
  locale: Locale = 'fr',
) {
  const t = TEXTS[locale];
  return layout(
    t.reset.title,
    `
      <p>${t.helloName(name)}</p>
      <p>${t.reset.p1}</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${escapeHtml(resetUrl)}" style="${BUTTON_STYLE}">
          ${t.reset.button}
        </a>
      </p>
      <p style="color:#8AA0AE;font-size:13px;">${t.reset.note}</p>
    `,
    logoUrl,
    locale,
  );
}

export interface FormRequestEmailData {
  firstName: string;
  lastName: string;
  city: string;
  state: string;
  country: string;
  email: string;
  phone: string;
  message: string;
  /** Langue choisie par le demandeur (« fr » ou « en »). */
  locale?: string;
}

function infoRow(label: string, valueHtml: string) {
  return `
    <tr>
      <td style="padding:6px 12px 6px 0;color:#8AA0AE;font-size:13px;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="padding:6px 0;color:#233241;font-size:15px;font-weight:bold;word-break:break-word;">${valueHtml}</td>
    </tr>`;
}

/**
 * E-mail envoyé aux administrateurs quand un futur membre demande son formulaire.
 * `locale` = langue de l'e-mail destiné aux administrateurs ; la langue choisie
 * par le demandeur (data.locale) y figure sur une ligne.
 */
export function formRequestEmail(
  data: FormRequestEmailData,
  adminUrl: string,
  logoUrl: string,
  locale: Locale = 'fr',
) {
  const t = TEXTS[locale].formRequest;
  const email = escapeHtml(data.email);
  const phone = escapeHtml(data.phone);
  const requesterLocale: Locale = parseLocale(data.locale);
  return layout(
    t.title,
    `
      <p>${TEXTS[locale].hello}</p>
      <p>${t.p1}</p>
      <div style="margin:16px 0;padding:14px 16px;background:#F7FAFC;border-left:3px solid ${THEME.accentGold};border-radius:6px;color:#233241;font-style:italic;">
        ${escapeHtml(data.message)}
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px;">
        ${infoRow(t.firstName, escapeHtml(data.firstName))}
        ${infoRow(t.lastName, escapeHtml(data.lastName))}
        ${infoRow(t.city, escapeHtml(data.city))}
        ${data.state ? infoRow(t.state, escapeHtml(data.state)) : ''}
        ${infoRow(t.country, escapeHtml(data.country))}
        ${infoRow(t.email, `<a href="mailto:${email}" style="color:${THEME.primary};text-decoration:none;">${email}</a>`)}
        ${infoRow(t.phone, `<a href="tel:${phone}" style="color:${THEME.primary};text-decoration:none;">${phone}</a>`)}
        ${infoRow(t.language, LANGUAGE_NAMES[locale][requesterLocale])}
      </table>
      <p style="text-align:center;margin:24px 0;">
        <a href="${escapeHtml(adminUrl)}" style="${BUTTON_STYLE}">
          ${t.button}
        </a>
      </p>
      <p style="color:#8AA0AE;font-size:13px;">${t.note}</p>
    `,
    logoUrl,
    locale,
  );
}
