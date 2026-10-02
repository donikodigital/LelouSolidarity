//backend/src/members/members.service.ts
// v1.5 — checkAccessCode() : état d'un lien (valide / déjà utilisé / invalide),
// utilisé par le formulaire public pour refuser l'ouverture d'un lien déjà
// consommé. submit() consomme désormais le code de façon atomique (deux envois
// simultanés avec le même code ne peuvent plus créer deux membres) et, en cas
// d'échec, supprime la photo déjà envoyée : le code reste alors utilisable et
// le membre reçoit un message clair.
// v1.4 — remove() supprime aussi le code d'accès du membre (dans la même
// transaction) : plus de code "utilisé" orphelin dans la liste des codes.
// v1.3 — ajout de update() (modification par l'admin) et remove()
// (suppression du membre + nettoyage Cloudinary : photo et PDF de carte).
// v1.2 — l'upload Cloudinary est désormais protégé lui aussi : en cas
// d'échec, on logue l'erreur réelle (visible dans les logs Render) et on
// renvoie un message clair à l'utilisateur au lieu d'un 500 générique.
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Member, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { MailService } from '../mail/mail.service';
import { SubmitMemberDto } from './dto/submit-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_PHOTO_MIME = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_CODE_LENGTH = 32;

export type AccessCodeState = 'VALID' | 'USED' | 'INVALID';

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

  /**
   * État d'un code d'accès, pour le formulaire public :
   * - VALID   : le code existe et n'a pas encore été utilisé
   * - USED    : une demande a déjà été envoyée avec ce code
   * - INVALID : code inconnu (ou supprimé)
   * Ne renvoie aucune autre information (pas d'e-mail, pas de membre).
   */
  async checkAccessCode(rawCode: string): Promise<{ status: AccessCodeState }> {
    const code = (rawCode ?? '').toUpperCase().trim();
    if (!code || code.length > MAX_CODE_LENGTH) {
      return { status: 'INVALID' };
    }

    const accessCode = await this.prisma.accessCode.findUnique({
      where: { code },
      select: { used: true },
    });

    if (!accessCode) return { status: 'INVALID' };
    return { status: accessCode.used ? 'USED' : 'VALID' };
  }

  async submit(dto: SubmitMemberDto, photo?: Express.Multer.File) {
    if (!photo) {
      throw new BadRequestException('La photo d’identité est obligatoire.');
    }
    if (!ALLOWED_PHOTO_MIME.includes(photo.mimetype)) {
      throw new BadRequestException('La photo doit être au format JPG ou PNG.');
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      throw new BadRequestException('La photo ne doit pas dépasser 10 Mo.');
    }

    const accessCode = await this.prisma.accessCode.findUnique({
      where: { code: dto.code.toUpperCase().trim() },
    });

    if (!accessCode) {
      throw new BadRequestException('Code d’accès invalide.');
    }
    if (accessCode.used) {
      throw new BadRequestException('Ce lien a déjà été utilisé : le formulaire ne peut plus être rempli.');
    }

    let upload: { secure_url: string; public_id: string };
    try {
      upload = await this.uploads.uploadMemberPhoto(photo.buffer, dto.email);
    } catch (err) {
      this.logger.error(
        `Échec de l'upload Cloudinary pour ${dto.email}: ${(err as Error).message}`,
      );
      throw new BadRequestException(
        'La photo n’a pas pu être enregistrée, merci de réessayer avec une autre photo (JPG ou PNG).',
      );
    }

    let member: Member;
    try {
      member = await this.prisma.$transaction(async (tx) => {
        // Consommation atomique du code : si un autre envoi l'a déjà pris
        // entre-temps, aucune ligne n'est modifiée et on refuse proprement.
        const claimed = await tx.accessCode.updateMany({
          where: { id: accessCode.id, used: false },
          data: { used: true, usedAt: new Date() },
        });
        if (claimed.count === 0) {
          throw new BadRequestException(
            'Ce lien a déjà été utilisé : le formulaire ne peut plus être rempli.',
          );
        }

        return tx.member.create({
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
      });
    } catch (err) {
      // Rien n'a été enregistré (la transaction est annulée) : on retire la
      // photo déjà envoyée sur Cloudinary pour ne pas laisser de fichier orphelin.
      await this.uploads.deleteMemberPhoto(upload.public_id).catch(() => undefined);

      if (err instanceof BadRequestException) throw err;

      this.logger.error(
        `Échec de l'enregistrement de la demande pour ${dto.email}: ${(err as Error).message}`,
      );
      throw new BadRequestException(
        'Votre demande n’a pas pu être enregistrée. Votre lien reste valable : merci de réessayer dans quelques instants.',
      );
    }

    // À ce stade, le membre est déjà enregistré et le code déjà consommé :
    // un échec d'envoi d'e-mail ne doit plus être fatal pour la requête.
    try {
      await this.mail.sendSubmissionReceived(member.email, member.firstName);
    } catch (err) {
      this.logger.error(
        `Échec de l'e-mail de confirmation pour ${member.email}: ${(err as Error).message}`,
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
   * Modification par l'administrateur : seuls les champs fournis sont mis à
   * jour. La carte déjà générée n'est PAS régénérée automatiquement (la
   * régénération renvoie un e-mail au membre) : c'est à l'admin de cliquer
   * sur le bouton de la carte après correction.
   */
  async update(id: string, dto: UpdateMemberDto) {
    await this.findOne(id);

    const data: Prisma.MemberUpdateInput = {};

    for (const field of UPDATABLE_TEXT_FIELDS) {
      const value = dto[field];
      if (value === undefined) continue;
      const trimmed = value.trim();
      if (!trimmed) {
        throw new BadRequestException('Aucun champ ne peut être vide.');
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
      throw new BadRequestException('Aucune modification à enregistrer.');
    }

    return this.prisma.member.update({ where: { id }, data });
  }

  /**
   * Suppression définitive d'un membre. On supprime d'abord en base (source
   * de vérité), puis on nettoie Cloudinary en "best effort" : un échec de
   * nettoyage est logué mais ne fait pas échouer la suppression.
   * Le code d'accès du membre est supprimé dans la même transaction (il
   * contient l'e-mail du membre et n'a plus de raison d'exister). Il ne
   * peut donc pas être réutilisé : le formulaire répondra "lien invalide".
   */
  async remove(id: string) {
    const member = await this.findOne(id);

    // Le membre porte la clé étrangère (accessCodeId) : on le supprime en
    // premier, puis son code d'accès.
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
          `Échec de la suppression Cloudinary (${labels[index]}) pour ${member.email}: ${(result.reason as Error).message}`,
        );
      } else if (result.value === 'not found') {
        this.logger.warn(
          `Fichier Cloudinary introuvable (${labels[index]}) pour ${member.email}`,
        );
      }
    });

    this.logger.log(
      `Membre supprimé: ${member.email} (${member.memberCode ?? 'sans carte'})`,
    );

    return { id };
  }
}