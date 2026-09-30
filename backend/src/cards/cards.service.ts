//backend/src/cards/cards.service.ts
// v1.3 — l'URL de verification du QR code utilise resolveFrontendUrl()
// (meme source que les e-mails : une seule adresse, sans "/" final).
// v1.2 — page PDF elargie pour accueillir recto + verso empiles, avec marge
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { MailService } from '../mail/mail.service';
import { resolveFrontendUrl } from '../common/frontend-url';
import { launchBrowser } from './browser.util';
import { PAGE_HEIGHT_MM, PAGE_WIDTH_MM } from './theme';
import { renderMemberCardHtml } from './card-template';

const CARD_VALIDITY_YEARS = 1;

@Injectable()
export class CardsService {
  private readonly logger = new Logger(CardsService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {
    this.frontendUrl = resolveFrontendUrl(this.config.get<string>('FRONTEND_URL'));
  }

  async generateCard(memberId: string) {
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Membre introuvable.');
    }

    const isFirstGeneration = !member.memberCode;
    const isRenewal = member.cardStatus === 'EXPIRING_SOON' || member.cardStatus === 'EXPIRED';
    const shouldResetValidity = isFirstGeneration || isRenewal;

    const memberCode = member.memberCode ?? (await this.nextMemberCode());
    const verifyToken = member.verifyToken ?? randomUUID();
    const cardIssuedAt = shouldResetValidity ? new Date() : member.cardIssuedAt ?? new Date();
    const cardExpiresAt = shouldResetValidity
      ? addYears(cardIssuedAt, CARD_VALIDITY_YEARS)
      : member.cardExpiresAt ?? addYears(cardIssuedAt, CARD_VALIDITY_YEARS);

    const verifyUrl = `${this.frontendUrl}/verify/${verifyToken}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, scale: 8 });

    const html = renderMemberCardHtml({
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

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await this.renderPdf(html);
    } catch (err) {
      this.logger.error(`Echec du rendu PDF pour ${member.email}: ${(err as Error).message}`);
      throw new BadRequestException(
        "La generation du PDF a echoue. Verifie la configuration du navigateur headless (Chromium).",
      );
    }

    let upload: { secure_url: string; public_id: string };
    try {
      upload = await this.uploads.uploadCardPdf(pdfBuffer, memberCode);
    } catch (err) {
      this.logger.error(`Echec de l'upload Cloudinary pour ${member.email}: ${(err as Error).message}`);
      throw new BadRequestException(
        "Le PDF n'a pas pu etre enregistre sur Cloudinary. Verifie les identifiants et les autorisations du compte.",
      );
    }

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

    try {
      await this.mail.sendCardReady(
        updated.email,
        updated.firstName,
        memberCode,
        cardExpiresAt,
        pdfBuffer,
      );
    } catch (err) {
      this.logger.error(
        `Echec de l'e-mail "carte prete" pour ${updated.email}: ${(err as Error).message}`,
      );
    }

    const action = isFirstGeneration ? 'generee' : isRenewal ? 'renouvelee' : 'reimprimee';
    this.logger.log(`Carte ${action} pour ${updated.email} (${memberCode})`);

    return updated;
  }

  private async renderPdf(html: string): Promise<Buffer> {
    const browser = await launchBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        width: `${PAGE_WIDTH_MM}mm`,
        height: `${PAGE_HEIGHT_MM}mm`,
        printBackground: true,
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private async nextMemberCode(): Promise<string> {
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
      if (!exists) return candidate;
    }

    return `${prefix}${Date.now().toString().slice(-4)}`;
  }
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}