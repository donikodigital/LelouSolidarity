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
var SchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
let SchedulerService = SchedulerService_1 = class SchedulerService {
    constructor(prisma, mail, config) {
        this.prisma = prisma;
        this.mail = mail;
        this.config = config;
        this.logger = new common_1.Logger(SchedulerService_1.name);
    }
    async handleExpirationChecks() {
        await this.sendUpcomingReminders();
        await this.markExpiredCards();
    }
    async sendUpcomingReminders() {
        const reminderDays = this.config.get('CARD_REMINDER_DAYS_BEFORE', 30);
        const now = new Date();
        const threshold = new Date(now);
        threshold.setDate(threshold.getDate() + Number(reminderDays));
        const members = await this.prisma.member.findMany({
            where: {
                cardStatus: 'ACTIVE',
                reminderSentAt: null,
                cardExpiresAt: { lte: threshold, gt: now },
            },
        });
        for (const member of members) {
            try {
                await this.mail.sendExpirationReminder(member.email, member.firstName, member.cardExpiresAt);
                await this.prisma.member.update({
                    where: { id: member.id },
                    data: { cardStatus: 'EXPIRING_SOON', reminderSentAt: new Date() },
                });
            }
            catch (err) {
                this.logger.error(`Echec de l'envoi du rappel d'expiration a ${member.email}: ${err.message}`);
            }
        }
        if (members.length) {
            this.logger.log(`${members.length} rappel(s) d'expiration envoye(s).`);
        }
    }
    async markExpiredCards() {
        const now = new Date();
        const members = await this.prisma.member.findMany({
            where: {
                cardStatus: { in: ['ACTIVE', 'EXPIRING_SOON'] },
                cardExpiresAt: { lte: now },
            },
        });
        for (const member of members) {
            try {
                await this.mail.sendCardExpired(member.email, member.firstName);
                await this.prisma.member.update({
                    where: { id: member.id },
                    data: { cardStatus: 'EXPIRED', expiredNotifiedAt: new Date() },
                });
            }
            catch (err) {
                this.logger.error(`Echec de la notification d'expiration a ${member.email}: ${err.message}`);
            }
        }
        if (members.length) {
            this.logger.log(`${members.length} carte(s) marquee(s) comme expiree(s).`);
        }
    }
};
exports.SchedulerService = SchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_7AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "handleExpirationChecks", null);
exports.SchedulerService = SchedulerService = SchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService,
        config_1.ConfigService])
], SchedulerService);
//# sourceMappingURL=scheduler.service.js.map