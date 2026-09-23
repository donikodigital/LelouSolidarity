import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { MailService } from '../mail/mail.service';
import { SubmitMemberDto } from './dto/submit-member.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_PHOTO_MIME = ['image/jpeg', 'image/jpg', 'image/png'];

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    private readonly mail: MailService,
  ) {}

  async submit(dto: SubmitMemberDto, photo?: Express.Multer.File) {
    if (!photo) {
      throw new BadRequestException("La photo d'identite est obligatoire.");
    }
    if (!ALLOWED_PHOTO_MIME.includes(photo.mimetype)) {
      throw new BadRequestException('La photo doit etre au format JPG ou PNG.');
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      throw new BadRequestException('La photo ne doit pas depasser 10 Mo.');
    }

    const accessCode = await this.prisma.accessCode.findUnique({
      where: { code: dto.code.toUpperCase().trim() },
    });

    if (!accessCode) {
      throw new BadRequestException("Code d'acces invalide.");
    }
    if (accessCode.used) {
      throw new BadRequestException("Ce code d'acces a deja ete utilise.");
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

  async findAll(query: ListMembersQueryDto) {
    return this.prisma.member.findMany({
      where: {
        status: query.status,
        cardStatus: query.cardStatus,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) {
      throw new NotFoundException('Membre introuvable.');
    }
    return member;
  }
}
