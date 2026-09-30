//backend/src/members/members.service.ts
// v1.4 — remove() supprime aussi le code d'acces du membre (dans la meme
// transaction) : plus de code "utilise" orphelin dans la liste des codes.
// v1.3 — ajout de update() (modification par l'admin) et remove()
// (suppression du membre + nettoyage Cloudinary : photo et PDF de carte).
// v1.2 — l'upload Cloudinary est desormais protege lui aussi : en cas
// d'echec, on logue l'erreur reelle (visible dans les logs Render) et on
// renvoie un message clair a l'utilisateur au lieu d'un 500 generique.
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { MailService } from '../mail/mail.service';
import { SubmitMemberDto } from './dto/submit-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_PHOTO_MIME = ['image/jpeg', 'image/jpg', 'image/png'];

// Champs texte modifiables tels quels (trim uniquement).
// birthDate et email ont un traitement propre dans update().
const UPDATABLE_TEXT_FIELDS = [
  'firstName',
  'lastName',
  'originDistrict',
  'addressLine',
  'city',
  'state',
  'zipCode',
  'phone',
] as const;

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

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

    let upload: { secure_url: string; public_id: string };
    try {
      upload = await this.uploads.uploadMemberPhoto(photo.buffer, dto.email);
    } catch (err) {
      this.logger.error(
        `Echec de l'upload Cloudinary pour ${dto.email}: ${(err as Error).message}`,
      );
      throw new BadRequestException(
        "La photo n'a pas pu etre enregistree, merci de reessayer avec une autre photo (JPG ou PNG).",
      );
    }

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

    // A ce stade, le membre est deja enregistre et le code deja consomme :
    // un echec d'envoi d'e-mail ne doit plus etre fatal pour la requete.
    try {
      await this.mail.sendSubmissionReceived(member.email, member.firstName);
    } catch (err) {
      this.logger.error(
        `Echec de l'e-mail de confirmation pour ${member.email}: ${(err as Error).message}`,
      );
    }

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

  /**
   * Modification par l'administrateur : seuls les champs fournis sont mis a
   * jour. La carte deja generee n'est PAS regeneree automatiquement (la
   * regeneration renvoie un e-mail au membre) : c'est a l'admin de cliquer
   * sur le bouton de la carte apres correction.
   */
  async update(id: string, dto: UpdateMemberDto) {
    await this.findOne(id);

    const data: Prisma.MemberUpdateInput = {};

    for (const field of UPDATABLE_TEXT_FIELDS) {
      const value = dto[field];
      if (value === undefined) continue;
      const trimmed = value.trim();
      if (!trimmed) {
        throw new BadRequestException('Aucun champ ne peut etre vide.');
      }
      data[field] = trimmed;
    }

    if (dto.birthDate !== undefined) {
      data.birthDate = new Date(dto.birthDate);
    }
    if (dto.email !== undefined) {
      data.email = dto.email.toLowerCase().trim();
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Aucune modification a enregistrer.');
    }

    return this.prisma.member.update({ where: { id }, data });
  }

  /**
   * Suppression definitive d'un membre. On supprime d'abord en base (source
   * de verite), puis on nettoie Cloudinary en "best effort" : un echec de
   * nettoyage est logue mais ne fait pas echouer la suppression.
   * Le code d'acces du membre est supprime dans la meme transaction (il
   * contient l'e-mail du membre et n'a plus de raison d'exister). Il ne
   * peut donc pas etre reutilise : le formulaire repondra "Code invalide".
   */
  async remove(id: string) {
    const member = await this.findOne(id);

    // Le membre porte la cle etrangere (accessCodeId) : on le supprime en
    // premier, puis son code d'acces.
    await this.prisma.$transaction(async (tx) => {
      await tx.member.delete({ where: { id } });
      await tx.accessCode.delete({ where: { id: member.accessCodeId } });
    });

    const labels = ['photo', 'carte PDF'];
    const results = await Promise.allSettled([
      member.photoPublicId
        ? this.uploads.deleteMemberPhoto(member.photoPublicId)
        : Promise.resolve('skipped'),
      member.cardPdfUrl
        ? this.uploads.deleteCardPdf(member.cardPdfUrl)
        : Promise.resolve('skipped'),
    ]);

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.error(
          `Echec de la suppression Cloudinary (${labels[index]}) pour ${member.email}: ${(result.reason as Error).message}`,
        );
      } else if (result.value === 'not found') {
        this.logger.warn(
          `Fichier Cloudinary introuvable (${labels[index]}) pour ${member.email}`,
        );
      }
    });

    this.logger.log(
      `Membre supprime: ${member.email} (${member.memberCode ?? 'sans carte'})`,
    );

    return { id };
  }
}