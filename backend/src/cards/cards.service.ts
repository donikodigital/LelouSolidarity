//backend/src/cards/cards.service.ts
// v2.0 — fin de Chromium : le PDF est dessiné avec pdfkit (card-pdf.ts).
//  - plus de navigateur à lancer : la génération passe d'environ 50 s à moins
//    d'une seconde et ne risque plus de dépasser les 512 Mo de Render ;
//  - la photo (déjà réduite par Cloudinary) est téléchargée par le serveur et
//    intégrée directement au PDF ; le QR code est généré en image PNG ;
//  - une seule génération à la fois, et les clics multiples sur « Générer »
//    pour un même membre sont regroupés (pas de carte ni d'e-mail en double) ;
//  - la RAM du conteneur reste écrite dans les logs (début / fin de génération).
// v1.4 — e-mail « carte prête » envoyé en arrière-plan, durée de chaque étape
// écrite dans les logs.
// v1.3 — l'URL de vérification du QR code utilise resolveFrontendUrl()
// (même source que les e-mails : une seule adresse, sans "/" final).
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Member } from '@prisma/client';
import * as QRCode from 'qrcode';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { MailService } from '../mail/mail.service';
import { resolveFrontendUrl } from '../common/frontend-url';
import { renderMemberCardPdf } from './card-pdf';

const CARD_VALIDITY_YEARS = 1;

// Cadre photo de la carte : 20 x 24,5 mm. 400 x 490 px suffisent largement à
// l'impression (≈ 500 dpi) et pèsent quelques dizaines de Ko.
const PHOTO_TRANSFORM = 'c_fill,g_auto,w_400,h_490,q_auto:good,f_jpg';
const PHOTO_FETCH_TIMEOUT_MS = 10_000;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

/**
 * Mémoire (en Mo) réellement utilisée par le conteneur. Renvoie null si les
 * compteurs du système sont indisponibles (ex. Windows en local).
 */
function containerMemoryMb(): number | null {
  try {
    const stat = readFileSync('/sys/fs/cgroup/memory.stat', 'utf8');
    const match = stat.match(/^anon (\d+)$/m);
    if (match) return Math.round(Number(match[1]) / 1048576);
  } catch {
    /* cgroup v2 absent */
  }
  try {
    const bytes = Number(readFileSync('/sys/fs/cgroup/memory/memory.usage_in_bytes', 'utf8').trim());
    if (Number.isFinite(bytes) && bytes > 0) return Math.round(bytes / 1048576);
  } catch {
    /* cgroup v1 absent */
  }
  return null;
}

@Injectable()
export class CardsService {
  private readonly logger = new Logger(CardsService.name);
  private readonly frontendUrl: string;

  // Générations en cours, par membre : un second clic rejoint la première.
  private readonly inFlight = new Map<string, Promise<Member>>();
  // Fin de la file d'attente : les générations passent l'une après l'autre.
  private queueTail: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {
    this.frontendUrl = resolveFrontendUrl(this.config.get<string>('FRONTEND_URL'));
  }

  generateCard(memberId: string): Promise<Member> {
    const running = this.inFlight.get(memberId);
    if (running) {
      this.logger.warn(`Génération déjà en cours pour le membre ${memberId} : demande regroupée.`);
      return running;
    }

    const job = this.enqueue(() => this.runGeneration(memberId)).finally(() => {
      this.inFlight.delete(memberId);
    });
    this.inFlight.set(memberId, job);
    return job;
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queueTail.then(() => task());
    this.queueTail = run.catch(() => undefined);
    return run;
  }

  private logMemory(label: string): void {
    const mb = containerMemoryMb();
    if (mb !== null) this.logger.log(`RAM conteneur (${label}) : ${mb} Mo / 512 Mo`);
  }

  private async runGeneration(memberId: string): Promise<Member> {
    // Chronomètre : une ligne de log récapitule la durée de chaque étape
    const startedAt = Date.now();
    const timings: string[] = [];
    let lapStart = startedAt;
    const lap = (label: string) => {
      const now = Date.now();
      timings.push(`${label} ${now - lapStart} ms`);
      lapStart = now;
    };

    this.logMemory('début');

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
    lap('base');

    const verifyUrl = `${this.frontendUrl}/verify/${verifyToken}`;
    const qrPng = await QRCode.toBuffer(verifyUrl, { margin: 1, scale: 8 });
    lap('qr');

    const photo = await this.fetchPhoto(member.photoUrl);
    lap('photo');

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await renderMemberCardPdf({
        firstName: member.firstName,
        lastName: member.lastName,
        birthYear: member.birthDate.getFullYear(),
        originDistrict: member.originDistrict,
        city: member.city,
        state: member.state,
        memberCode,
        issuedAt: cardIssuedAt,
        expiresAt: cardExpiresAt,
        photo,
        qrPng,
        status: 'ACTIVE',
      });
    } catch (err) {
      this.logger.error(`Échec du rendu PDF pour ${member.email}: ${(err as Error).message}`);
      throw new BadRequestException('La génération du PDF de la carte a échoué.');
    }
    lap('pdf');

    let upload: { secure_url: string; public_id: string };
    try {
      upload = await this.uploads.uploadCardPdf(pdfBuffer, memberCode);
    } catch (err) {
      this.logger.error(`Échec de l'upload Cloudinary pour ${member.email}: ${(err as Error).message}`);
      throw new BadRequestException(
        'Le PDF n’a pas pu être enregistré sur Cloudinary. Vérifie les identifiants et les autorisations du compte.',
      );
    }
    lap('upload');

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
    lap('base');

    // L'e-mail part en arrière-plan : la carte est déjà enregistrée, l'administrateur
    // n'a pas à attendre Resend. En cas d'échec, l'erreur est écrite dans les logs.
    void this.mail
      .sendCardReady(updated.email, updated.firstName, memberCode, cardExpiresAt, pdfBuffer)
      .catch((err) =>
        this.logger.error(
          `Échec de l'e-mail "carte prête" pour ${updated.email}: ${(err as Error).message}`,
        ),
      );

    const action = isFirstGeneration ? 'générée' : isRenewal ? 'renouvelée' : 'réimprimée';
    this.logger.log(
      `Carte ${action} pour ${updated.email} (${memberCode}) en ${Date.now() - startedAt} ms ` +
        `[${timings.join(', ')}] · PDF ${(pdfBuffer.length / 1024).toFixed(0)} Ko`,
    );
    this.logMemory('fin');

    return updated;
  }

  /**
   * Télécharge la photo du membre : d'abord la version réduite et recadrée par
   * Cloudinary, puis, si elle est indisponible, l'original. Renvoie null si
   * aucune photo n'est exploitable : la carte est générée dans tous les cas
   * (un pictogramme remplace alors la photo).
   */
  private async fetchPhoto(original: string | null | undefined): Promise<Buffer | null> {
    if (!original || !original.trim()) return null;

    const candidates = [this.optimizedPhotoUrl(original), original].filter(
      (url, index, all): url is string => !!url && all.indexOf(url) === index,
    );

    for (const url of candidates) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(PHOTO_FETCH_TIMEOUT_MS) });
        if (!res.ok) {
          this.logger.warn(`Photo indisponible (HTTP ${res.status}) : ${url === original ? 'original' : 'version réduite'}.`);
          continue;
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length > MAX_PHOTO_BYTES) {
          this.logger.warn(`Photo trop lourde (${(buffer.length / 1048576).toFixed(1)} Mo) : ignorée.`);
          continue;
        }
        return buffer;
      } catch (err) {
        this.logger.warn(`Photo non téléchargeable (${(err as Error).message}).`);
      }
    }
    return null;
  }

  /** Adresse Cloudinary de la version réduite (400 x 490 px, JPEG) ; null si l'URL n'est pas Cloudinary. */
  private optimizedPhotoUrl(original: string): string | null {
    const marker = '/image/upload/';
    const index = original.indexOf(marker);
    if (!original.includes('res.cloudinary.com') || index === -1) return null;
    return `${original.slice(0, index + marker.length)}${PHOTO_TRANSFORM}/${original.slice(index + marker.length)}`;
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