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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
let AuthService = class AuthService {
    constructor(prisma, jwt, mail) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.mail = mail;
    }
    async login(dto) {
        const admin = await this.prisma.admin.findUnique({
            where: { email: dto.email.toLowerCase().trim() },
        });
        if (!admin) {
            throw new common_1.UnauthorizedException('Identifiants incorrects');
        }
        const valid = await bcrypt.compare(dto.password, admin.passwordHash);
        if (!valid) {
            throw new common_1.UnauthorizedException('Identifiants incorrects');
        }
        const accessToken = await this.jwt.signAsync({
            sub: admin.id,
            email: admin.email,
        });
        return {
            accessToken,
            admin: { id: admin.id, email: admin.email, name: admin.name },
        };
    }
    async requestPasswordReset(dto) {
        const admin = await this.prisma.admin.findUnique({
            where: { email: dto.email.toLowerCase().trim() },
        });
        const genericMessage = 'Si un compte existe avec cet e-mail, un lien de reinitialisation a ete envoye.';
        if (!admin)
            return { message: genericMessage };
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await this.prisma.admin.update({
            where: { id: admin.id },
            data: { resetToken: token, resetTokenExpiresAt: expiresAt },
        });
        await this.mail.sendPasswordReset(admin.email, admin.name || 'Administrateur', token);
        return { message: genericMessage };
    }
    async resetPassword(dto) {
        const admin = await this.prisma.admin.findFirst({ where: { resetToken: dto.token } });
        if (!admin || !admin.resetTokenExpiresAt || admin.resetTokenExpiresAt < new Date()) {
            throw new common_1.BadRequestException('Ce lien de reinitialisation est invalide ou a expire.');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        await this.prisma.admin.update({
            where: { id: admin.id },
            data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
        });
        return { message: 'Mot de passe mis a jour avec succes.' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map