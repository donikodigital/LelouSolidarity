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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessCodesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const code_generator_1 = require("./utils/code-generator");
let AccessCodesService = class AccessCodesService {
    constructor(prisma, mail) {
        this.prisma = prisma;
        this.mail = mail;
    }
    async generateAndSend(email) {
        let accessCode = null;
        for (let attempt = 0; attempt < 5 && !accessCode; attempt++) {
            const code = (0, code_generator_1.generateAccessCode)(8);
            try {
                accessCode = await this.prisma.accessCode.create({
                    data: { code, email: email.toLowerCase().trim() },
                });
            }
            catch (err) {
                if (err?.code !== 'P2002')
                    throw err;
            }
        }
        if (!accessCode) {
            throw new Error("Impossible de generer un code d'acces unique, reessaie.");
        }
        await this.mail.sendAccessCode(accessCode.email, accessCode.code);
        return { id: accessCode.id, email: accessCode.email, code: accessCode.code };
    }
    async list() {
        return this.prisma.accessCode.findMany({
            orderBy: { createdAt: 'desc' },
            include: { member: { select: { id: true, firstName: true, lastName: true } } },
        });
    }
};
exports.AccessCodesService = AccessCodesService;
exports.AccessCodesService = AccessCodesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], AccessCodesService);
//# sourceMappingURL=access-codes.service.js.map