"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CardsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const QRCode = __importStar(require("qrcode"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const uploads_service_1 = require("../uploads/uploads.service");
const mail_service_1 = require("../mail/mail.service");
const browser_util_1 = require("./browser.util");
const theme_1 = require("./theme");
const card_template_1 = require("./card-template");
const CARD_VALIDITY_YEARS = 1;
let CardsService = CardsService_1 = class CardsService {
    constructor(prisma, uploads, mail, config) {
        this.prisma = prisma;
        this.uploads = uploads;
        this.mail = mail;
        this.config = config;
        this.logger = new common_1.Logger(CardsService_1.name);
    }
    async generateCard(memberId) {
        const member = await this.prisma.member.findUnique({ where: { id: memberId } });
        if (!member) {
            throw new common_1.NotFoundException('Membre introuvable.');
        }
        const isFirstGeneration = !member.memberCode;
        const isRenewal = member.cardStatus === 'EXPIRING_SOON' || member.cardStatus === 'EXPIRED';
        const shouldResetValidity = isFirstGeneration || isRenewal;
        const memberCode = member.memberCode ?? (await this.nextMemberCode());
        const verifyToken = member.verifyToken ?? (0, crypto_1.randomUUID)();
        const cardIssuedAt = shouldResetValidity ? new Date() : member.cardIssuedAt ?? new Date();
        const cardExpiresAt = shouldResetValidity
            ? addYears(cardIssuedAt, CARD_VALIDITY_YEARS)
            : member.cardExpiresAt ?? addYears(cardIssuedAt, CARD_VALIDITY_YEARS);
        const frontendUrl = this.config.get('FRONTEND_URL', '');
        const verifyUrl = `${frontendUrl}/verify/${verifyToken}`;
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, scale: 8 });
        const html = (0, card_template_1.renderMemberCardHtml)({
            firstName: member.firstName,
            lastName: member.lastName,
            birthYear: member.birthDate.getFullYear(),
            originDistrict: member.originDistrict,
            city: member.city,
            state: member.state,
            memberCode,
            issuedAt: cardIssuedAt,
            expiresAt: cardExpiresAt,
            photoUrl: member.photoUrl,
            qrDataUrl,
            status: 'ACTIVE',
        });
        const pdfBuffer = await this.renderPdf(html);
        const upload = await this.uploads.uploadCardPdf(pdfBuffer, memberCode);
        const updated = await this.prisma.member.update({
            where: { id: member.id },
            data: {
                status: 'VALIDATED',
                memberCode,
                verifyToken,
                cardIssuedAt,
                cardExpiresAt,
                cardStatus: 'ACTIVE',
                cardPdfUrl: upload.secure_url,
                reminderSentAt: null,
                expiredNotifiedAt: null,
            },
        });
        await this.mail.sendCardReady(updated.email, updated.firstName, memberCode, cardExpiresAt, pdfBuffer);
        const action = isFirstGeneration ? 'generee' : isRenewal ? 'renouvelee' : 'reimprimee';
        this.logger.log(`Carte ${action} pour ${updated.email} (${memberCode})`);
        return updated;
    }
    async renderPdf(html) {
        const browser = await (0, browser_util_1.launchBrowser)();
        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const pdf = await page.pdf({
                width: `${theme_1.CARD_WIDTH_MM}mm`,
                height: `${theme_1.CARD_HEIGHT_MM}mm`,
                printBackground: true,
                margin: { top: 0, bottom: 0, left: 0, right: 0 },
            });
            return Buffer.from(pdf);
        }
        finally {
            await browser.close();
        }
    }
    async nextMemberCode() {
        const year = new Date().getFullYear();
        const prefix = `LS-${year}-`;
        for (let attempt = 0; attempt < 5; attempt++) {
            const count = await this.prisma.member.count({
                where: { memberCode: { startsWith: prefix } },
            });
            const candidate = `${prefix}${String(count + 1 + attempt).padStart(4, '0')}`;
            const exists = await this.prisma.member.findUnique({
                where: { memberCode: candidate },
            });
            if (!exists)
                return candidate;
        }
        return `${prefix}${Date.now().toString().slice(-4)}`;
    }
};
exports.CardsService = CardsService;
exports.CardsService = CardsService = CardsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        uploads_service_1.UploadsService,
        mail_service_1.MailService,
        config_1.ConfigService])
], CardsService);
function addYears(date, years) {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
}
//# sourceMappingURL=cards.service.js.map