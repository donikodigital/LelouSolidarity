"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessCodeEmail = accessCodeEmail;
exports.submissionReceivedEmail = submissionReceivedEmail;
exports.cardReadyEmail = cardReadyEmail;
exports.expirationReminderEmail = expirationReminderEmail;
exports.cardExpiredEmail = cardExpiredEmail;
exports.resetPasswordEmail = resetPasswordEmail;
const theme_1 = require("../common/theme");
function layout(title, bodyHtml) {
    return `
  <div style="background:#F2F5F7;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.06);">
      <div style="background:linear-gradient(135deg, ${theme_1.THEME.primary}, ${theme_1.THEME.primaryDark});padding:24px 28px;">
        <p style="margin:0;color:#FFFFFF;font-size:20px;font-weight:bold;letter-spacing:0.5px;">
          ${theme_1.THEME.associationName}
        </p>
      </div>
      <div style="padding:28px;color:#233241;font-size:15px;line-height:1.6;">
        <h1 style="font-size:18px;color:${theme_1.THEME.primaryDark};margin:0 0 16px;">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:16px 28px;background:#F7FAFC;color:#8AA0AE;font-size:12px;">
        ${theme_1.THEME.associationName} &mdash; association des ressortissants de Lelouma aux Etats-Unis
      </div>
    </div>
  </div>`;
}
function accessCodeEmail(code, formUrl) {
    return layout('Votre code d\u2019acces au formulaire membre', `
      <p>Bonjour,</p>
      <p>Voici votre code personnel pour remplir le formulaire d'adhesion de <strong>${theme_1.THEME.associationName}</strong> :</p>
      <p style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;background:${theme_1.THEME.primaryLightTint};color:${theme_1.THEME.primaryDark};font-size:24px;font-weight:bold;letter-spacing:4px;padding:12px 24px;border-radius:8px;">
          ${code}
        </span>
      </p>
      <p>Rendez-vous sur le formulaire ci-dessous et saisissez ce code pour pouvoir l'envoyer :</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${formUrl}" style="background:${theme_1.THEME.primary};color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">
          Remplir le formulaire
        </a>
      </p>
      <p style="color:#8AA0AE;font-size:13px;">Ce code est personnel, ne le partagez pas.</p>
    `);
}
function submissionReceivedEmail(firstName) {
    return layout('Demande bien recue', `
      <p>Bonjour ${firstName},</p>
      <p>Nous avons bien recu vos informations. Votre carte de membre est en cours de traitement par l'administrateur de l'association et vous sera envoyee par e-mail des qu'elle sera prete.</p>
      <p>Merci pour votre confiance.</p>
    `);
}
function cardReadyEmail(firstName, memberCode, expiresAt) {
    return layout('Votre carte de membre est prete', `
      <p>Bonjour ${firstName},</p>
      <p>Votre carte de membre <strong>${memberCode}</strong> est prete et jointe a cet e-mail au format PDF.</p>
      <p>Elle est valable jusqu'au <strong>${expiresAt}</strong>. Nous vous recommandons de l'imprimer et de la faire plastifier.</p>
      <p>Un QR code figure sur la carte : il permet a tout moment de verifier son authenticite et son statut.</p>
    `);
}
function expirationReminderEmail(firstName, expiresAt) {
    return layout('Votre carte de membre arrive bientot a expiration', `
      <p>Bonjour ${firstName},</p>
      <p>Votre carte de membre arrivera a expiration le <strong>${expiresAt}</strong>.</p>
      <p>Merci de contacter le tresorier de l'association pour regulariser votre cotisation et permettre le renouvellement de votre carte.</p>
    `);
}
function cardExpiredEmail(firstName) {
    return layout('Votre carte de membre a expire', `
      <p>Bonjour ${firstName},</p>
      <p>Votre carte de membre est arrivee a expiration aujourd'hui.</p>
      <p>Merci de vous rapprocher du tresorier de l'association pour regulariser votre cotisation ; votre carte sera alors renouvelee.</p>
    `);
}
function resetPasswordEmail(name, resetUrl) {
    return layout('Reinitialisation de votre mot de passe', `
      <p>Bonjour ${name},</p>
      <p>Vous avez demande la reinitialisation de votre mot de passe administrateur pour <strong>${theme_1.THEME.associationName}</strong>.</p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${resetUrl}" style="background:${theme_1.THEME.primary};color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;">
          Reinitialiser mon mot de passe
        </a>
      </p>
      <p style="color:#8AA0AE;font-size:13px;">Ce lien expire dans 1 heure. Si vous n'etes pas a l'origine de cette demande, ignorez cet e-mail.</p>
    `);
}
//# sourceMappingURL=templates.js.map