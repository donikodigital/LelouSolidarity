"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const resend_1 = require("resend");
const templates_1 = require("./templates");
let MailService = MailService_1 = class MailService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(MailService_1.name);
        this.resend = new resend_1.Resend(this.config.get('RESEND_API_KEY'));
        this.from = this.config.get('MAIL_FROM', 'LELOU SOLIDARITY <no-reply@example.org>');
        this.frontendUrl = this.config.get('FRONTEND_URL', '');
    }
    async sendAccessCode(email, code) {
        const formUrl = `${this.frontendUrl}/formulaire`;
        return this.send(email, 'Votre code d\u2019acces LELOU SOLIDARITY', (0, templates_1.accessCodeEmail)(code, formUrl));
    }
    async sendPasswordReset(email, name, token) {
        const resetUrl = `${this.frontendUrl}/admin/reset-password/${token}`;
        return this.send(email, 'Reinitialisation de mot de passe - LELOU SOLIDARITY', (0, templates_1.resetPasswordEmail)(name, resetUrl));
    }
    async sendSubmissionReceived(email, firstName) {
        return this.send(email, 'Demande recue - LELOU SOLIDARITY', (0, templates_1.submissionReceivedEmail)(firstName));
    }
    async sendCardReady(email, firstName, memberCode, expiresAt, pdfBuffer) {
        return this.send(email, 'Votre carte de membre LELOU SOLIDARITY', (0, templates_1.cardReadyEmail)(firstName, memberCode, formatDate(expiresAt)), [
            {
                filename: `carte-membre-${memberCode}.pdf`,
                content: pdfBuffer.toString('base64'),
            },
        ]);
    }
    async sendExpirationReminder(email, firstName, expiresAt) {
        return this.send(email, 'Votre carte arrive a expiration - LELOU SOLIDARITY', (0, templates_1.expirationReminderEmail)(firstName, formatDate(expiresAt)));
    }
    async sendCardExpired(email, firstName) {
        return this.send(email, 'Votre carte a expire - LELOU SOLIDARITY', (0, templates_1.cardExpiredEmail)(firstName));
    }
    async send(to, subject, html, attachments) {
        try {
            const { data, error } = await this.resend.emails.send({
                from: this.from,
                to,
                subject,
                html,
                attachments,
            });
            if (error) {
                throw new Error(error.message || "Echec d'envoi via Resend");
            }
            return data;
        }
        catch (err) {
            this.logger.error(`Echec d'envoi d'e-mail a ${to}: ${err.message}`);
            throw err;
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
function formatDate(date) {
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(date);
}
//# sourceMappingURL=mail.service.js.map