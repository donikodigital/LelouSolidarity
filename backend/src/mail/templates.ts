//backend/src/mail/templates.ts
// Gabarits d'e-mails en HTML simple (compatible avec la plupart des clients
// mail). Les couleurs viennent de src/common/theme.ts - un seul endroit à
// modifier pour tout répercuter (carte + e-mails).
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

/** Neutralise le HTML dans une valeur saisie par un utilisateur. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout(title: string, bodyHtml: string, logoUrl: string): string {
  return `
  <div style="background:#F2F5F7;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      <div style="background-color:${THEME.primaryDark};background-image:linear-gradient(135deg, ${THEME.primary}, ${THEME.primaryDark});padding:22px 28px;border-bottom:3px solid ${THEME.accentGold};">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-right:14px;vertical-align:middle;">
              <img src="${escapeHtml(logoUrl)}" width="54" height="54" alt="Logo ${THEME.associationName}" style="display:block;width:54px;height:54px;border-radius:50%;border:2px solid ${THEME.accentGold};background:#FFFFFF;" />
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
        ${THEME.associationName} &mdash; association des ressortissants de Lelouma aux États-Unis
      </div>
    </div>
  </div>`;
}

export function accessCodeEmail(formUrl: string, logoUrl: string) {
  return layout(
    'Votre accès au formulaire d’adhésion',
    `
      <p>Bonjour,</p>
      <p>Nous avons le plaisir de vous inviter à remplir votre formulaire d'adhésion à <strong>${THEME.associationName}</strong>.</p>
      <p>Cliquez sur le bouton ci-dessous pour y accéder : votre accès personnel est déjà activé, vous n'avez aucun code à saisir.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${escapeHtml(formUrl)}" style="background:${THEME.primary};color:#FFFFFF;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:bold;display:inline-block;border-bottom:3px solid ${THEME.accentGold};">
          Remplir le formulaire
        </a>
      </p>
      <p style="color:#8AA0AE;font-size:13px;">Ce lien est personnel et ne peut être utilisé qu'une seule fois : ne le partagez pas. Une fois votre demande envoyée, il ne permettra plus d'ouvrir le formulaire.</p>
    `,
    logoUrl,
  );
}

export function submissionReceivedEmail(firstName: string, logoUrl: string) {
  return layout(
    'Demande bien reçue',
    `
      <p>Bonjour ${escapeHtml(firstName)},</p>
      <p>Nous avons bien reçu vos informations. Votre carte de membre est en cours de traitement par l'administrateur de l'association et vous sera envoyée par e-mail dès qu'elle sera prête.</p>
      <p>Merci pour votre confiance.</p>
    `,
    logoUrl,
  );
}

export function cardReadyEmail(
  firstName: string,
  memberCode: string,
  expiresAt: string,
  logoUrl: string,
) {
  return layout(
    'Votre carte de membre est prête',
    `
      <p>Bonjour ${escapeHtml(firstName)},</p>
      <p>Votre carte de membre <strong>${escapeHtml(memberCode)}</strong> est prête et jointe à cet e-mail au format PDF.</p>
      <p>Elle est valable jusqu'au <strong>${escapeHtml(expiresAt)}</strong>. Nous vous recommandons de l'imprimer et de la faire plastifier.</p>
      <p>Un QR code figure sur la carte : il permet à tout moment de vérifier son authenticité et son statut.</p>
    `,
    logoUrl,
  );
}

export function expirationReminderEmail(firstName: string, expiresAt: string, logoUrl: string) {
  return layout(
    'Votre carte de membre arrive bientôt à expiration',
    `
      <p>Bonjour ${escapeHtml(firstName)},</p>
      <p>Votre carte de membre arrivera à expiration le <strong>${escapeHtml(expiresAt)}</strong>.</p>
      <p>Merci de contacter le trésorier de l'association pour régulariser votre cotisation et permettre le renouvellement de votre carte.</p>
    `,
    logoUrl,
  );
}

export function cardExpiredEmail(firstName: string, logoUrl: string) {
  return layout(
    'Votre carte de membre a expiré',
    `
      <p>Bonjour ${escapeHtml(firstName)},</p>
      <p>Votre carte de membre est arrivée à expiration aujourd'hui.</p>
      <p>Merci de vous rapprocher du trésorier de l'association pour régulariser votre cotisation ; votre carte sera alors renouvelée.</p>
    `,
    logoUrl,
  );
}

export function resetPasswordEmail(name: string, resetUrl: string, logoUrl: string) {
  return layout(
    'Réinitialisation de votre mot de passe',
    `
      <p>Bonjour ${escapeHtml(name)},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe administrateur pour <strong>${THEME.associationName}</strong>.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${resetUrl}" style="background:${THEME.primary};color:#FFFFFF;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:bold;display:inline-block;border-bottom:3px solid ${THEME.accentGold};">
          Réinitialiser mon mot de passe
        </a>
      </p>
      <p style="color:#8AA0AE;font-size:13px;">Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
    `,
    logoUrl,
  );
}

export interface FormRequestEmailData {
  firstName: string;
  lastName: string;
  city: string;
  email: string;
  phone: string;
  message: string;
}

function infoRow(label: string, valueHtml: string) {
  return `
    <tr>
      <td style="padding:6px 12px 6px 0;color:#8AA0AE;font-size:13px;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="padding:6px 0;color:#233241;font-size:15px;font-weight:bold;word-break:break-word;">${valueHtml}</td>
    </tr>`;
}

/** E-mail envoyé aux administrateurs quand un futur membre demande son formulaire. */
export function formRequestEmail(data: FormRequestEmailData, adminUrl: string, logoUrl: string) {
  const email = escapeHtml(data.email);
  const phone = escapeHtml(data.phone);
  return layout(
    'Nouvelle demande de formulaire d’adhésion',
    `
      <p>Bonjour,</p>
      <p>Un futur membre demande l'envoi de son formulaire d'adhésion :</p>
      <div style="margin:16px 0;padding:14px 16px;background:#F7FAFC;border-left:3px solid ${THEME.accentGold};border-radius:6px;color:#233241;font-style:italic;">
        ${escapeHtml(data.message)}
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px;">
        ${infoRow('Prénom', escapeHtml(data.firstName))}
        ${infoRow('Nom', escapeHtml(data.lastName))}
        ${infoRow('Ville', escapeHtml(data.city))}
        ${infoRow('E-mail', `<a href="mailto:${email}" style="color:${THEME.primary};text-decoration:none;">${email}</a>`)}
        ${infoRow('Téléphone', `<a href="tel:${phone}" style="color:${THEME.primary};text-decoration:none;">${phone}</a>`)}
      </table>
      <p style="text-align:center;margin:24px 0;">
        <a href="${escapeHtml(adminUrl)}" style="background:${THEME.primary};color:#FFFFFF;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:bold;display:inline-block;border-bottom:3px solid ${THEME.accentGold};">
          Ouvrir la demande
        </a>
      </p>
      <p style="color:#8AA0AE;font-size:13px;">Vous pouvez aussi répondre directement à cet e-mail : votre réponse sera adressée au membre.</p>
    `,
    logoUrl,
  );
}