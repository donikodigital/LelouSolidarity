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
exports.MembersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const uploads_service_1 = require("../uploads/uploads.service");
const mail_service_1 = require("../mail/mail.service");
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ALLOWED_PHOTO_MIME = ['image/jpeg', 'image/jpg', 'image/png'];
let MembersService = class MembersService {
    constructor(prisma, uploads, mail) {
        this.prisma = prisma;
        this.uploads = uploads;
        this.mail = mail;
    }
    async submit(dto, photo) {
        if (!photo) {
            throw new common_1.BadRequestException("La photo d'identite est obligatoire.");
        }
        if (!ALLOWED_PHOTO_MIME.includes(photo.mimetype)) {
            throw new common_1.BadRequestException('La photo doit etre au format JPG ou PNG.');
        }
        if (photo.size > MAX_PHOTO_BYTES) {
            throw new common_1.BadRequestException('La photo ne doit pas depasser 10 Mo.');
        }
        const accessCode = await this.prisma.accessCode.findUnique({
            where: { code: dto.code.toUpperCase().trim() },
        });
        if (!accessCode) {
            throw new common_1.BadRequestException("Code d'acces invalide.");
        }
        if (accessCode.used) {
            throw new common_1.BadRequestException("Ce code d'acces a deja ete utilise.");
        }
        const upload = await this.uploads.uploadMemberPhoto(photo.buffer, dto.email);
        const member = await this.prisma.$transaction(async (tx) => {
            const created = await tx.member.create({
                data: {
                    accessCodeId: accessCode.id,
                    firstName: dto.firstName.trim(),
                    lastName: dto.lastName.trim(),
                    birthDate: new Date(dto.birthDate),
                    originDistrict: dto.originDistrict.trim(),
                    addressLine: dto.addressLine.trim(),
                    city: dto.city.trim(),
                    state: dto.state.trim(),
                    zipCode: dto.zipCode.trim(),
                    phone: dto.phone.trim(),
                    email: dto.email.toLowerCase().trim(),
                    photoUrl: upload.secure_url,
                    photoPublicId: upload.public_id,
                },
            });
            await tx.accessCode.update({
                where: { id: accessCode.id },
                data: { used: true, usedAt: new Date() },
            });
            return created;
        });
        await this.mail.sendSubmissionReceived(member.email, member.firstName);
        return { id: member.id, status: member.status };
    }
    async findAll(query) {
        return this.prisma.member.findMany({
            where: {
                status: query.status,
                cardStatus: query.cardStatus,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const member = await this.prisma.member.findUnique({ where: { id } });
        if (!member) {
            throw new common_1.NotFoundException('Membre introuvable.');
        }
        return member;
    }
};
exports.MembersService = MembersService;
exports.MembersService = MembersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        uploads_service_1.UploadsService,
        mail_service_1.MailService])
], MembersService);
//# sourceMappingURL=members.service.js.map