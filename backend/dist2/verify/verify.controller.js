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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const prisma_service_1 = require("../prisma/prisma.service");
let VerifyController = class VerifyController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async verify(token) {
        const member = await this.prisma.member.findUnique({ where: { verifyToken: token } });
        if (!member || !member.memberCode) {
            throw new common_1.NotFoundException('Carte introuvable.');
        }
        const now = new Date();
        const isExpired = member.cardExpiresAt ? member.cardExpiresAt < now : true;
        const status = isExpired ? 'EXPIRED' : member.cardStatus;
        return {
            valid: true,
            status,
            memberCode: member.memberCode,
            fullName: `${member.firstName} ${member.lastName}`,
            originDistrict: member.originDistrict,
            residence: `${member.city}, ${member.state}`,
            issuedAt: member.cardIssuedAt,
            expiresAt: member.cardExpiresAt,
        };
    }
};
exports.VerifyController = VerifyController;
__decorate([
    (0, common_1.Get)(':token'),
    (0, throttler_1.Throttle)({ default: { limit: 30, ttl: 60_000 } }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VerifyController.prototype, "verify", null);
exports.VerifyController = VerifyController = __decorate([
    (0, common_1.Controller)('public/verify'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VerifyController);
//# sourceMappingURL=verify.controller.js.map