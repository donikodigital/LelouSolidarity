//backend/src/cards/cards.service.ts
// v1.5 — protection contre le manque de mémoire (instance Render de 512 Mo) :
//  - une seule génération de carte à la fois (file d'attente) : deux Chromium en
//    parallèle dépassent les 512 Mo ;
//  - si on clique plusieurs fois sur « Générer » pour le même membre, les clics
//    suivants rejoignent la génération déjà en cours (pas de carte ni d'e-mail en double) ;
//  - la RAM utilisée par le conteneur est écrite dans les logs à chaque étape clé
//    (l'onglet Metrics de Render ne la montre pas sur l'offre gratuite).
// v1.4 — génération de la carte plus rapide :
//  - navigateur Chromium réutilisé d'une carte à l'autre (browser.util.ts) ;
//  - photo réduite à la bonne taille par Cloudinary (au lieu de l'original, qui
//    peut peser plusieurs Mo et alourdissait le PDF, l'envoi et l'e-mail) ;
//  - chargement « load » au lieu de « networkidle0 » (pas d'attente inutile) ;
//  - e-mail « carte prête » envoyé en arrière-plan : la réponse n'attend plus Resend ;
//  - durée de chaque étape écrite dans les logs (visible dans les logs Render).
// v1.3 — l'URL de vérification du QR code utilise resolveFrontendUrl()
// (même source que les e-mails : une seule adresse, sans "/" final).
// v1.2 — page PDF élargie pour accueillir recto + verso empilés, avec marge
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
import { getBrowser, releaseBrowser } from './browser.util';
import { PAGE_HEIGHT_MM, PAGE_WIDTH_MM } from './theme';
import { renderMemberCardHtml } from './card-template';

const CARD_VALIDITY_YEARS = 1;

// Cadre photo de la carte : 20 x 24,5 mm. 400 x 490 px suffisent largement à
// l'impression (≈ 500 dpi) et pèsent quelques dizaines de Ko.
const PHOTO_TRANSFORM = 'c_fill,g_auto,w_400,h_490,q_auto:good,f_jpg';
const PHOTO_CHECK_TIMEOUT_MS = 6_000;

/**
 * Mémoire (en Mo) réellement utilisée par le conteneur : Node + Chromium + Prisma.
 * C'est cette valeur que Render compare à la limite de 512 Mo. On lit les
 * compteurs du système ; renvoie null si indisponibles (ex. Windows en local).
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
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, scale: 8 });
    lap('qr');

    const photoUrl = await this.resolvePhotoUrl(member.photoUrl);
    lap('photo');

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
      photoUrl,
      qrDataUrl,
      status: 'ACTIVE',
    });

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await this.renderPdf(html, lap);
    } catch (err) {
      this.logger.error(`Échec du rendu PDF pour ${member.email}: ${(err as Error).message}`);
      throw new BadRequestException(
        'La génération du PDF a échoué. Vérifie la configuration du navigateur headless (Chromium).',
      );
    }

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
   * Demande à Cloudinary une version réduite et recadrée de la photo. Si cette
   * version est indisponible (transformations restreintes, réseau...), on
   * retombe sur l'original : la carte est générée dans tous les cas.
   */
  private async resolvePhotoUrl(original: string): Promise<string> {
    const marker = '/image/upload/';
    const index = original.indexOf(marker);
    if (!original.includes('res.cloudinary.com') || index === -1) return original;

    const optimized = `${original.slice(0, index + marker.length)}${PHOTO_TRANSFORM}/${original.slice(
      index + marker.length,
    )}`;

    try {
      // Au passage, cette requête fait préparer l'image par Cloudinary : le
      // navigateur la reçoit ensuite immédiatement.
      const res = await fetch(optimized, {
        method: 'HEAD',
        signal: AbortSignal.timeout(PHOTO_CHECK_TIMEOUT_MS),
      });
      if (res.ok) return optimized;
      this.logger.warn(`Photo réduite indisponible (HTTP ${res.status}) : photo d'origine utilisée.`);
    } catch (err) {
      this.logger.warn(`Photo réduite non vérifiable (${(err as Error).message}) : photo d'origine utilisée.`);
    }
    return original;
  }

  private async renderPdf(html: string, lap: (label: string) => void): Promise<Buffer> {
    const browser = await getBrowser();
    lap('navigateur');
    this.logMemory('Chromium lancé');
    try {
      const page = await browser.newPage();
      try {
        // « load » attend le chargement des images (photo, logo, QR) sans les
        // 500 ms de silence réseau de « networkidle0 ».
        await page.setContent(html, { waitUntil: 'load', timeout: 30_000 });
        lap('chargement');
        this.logMemory('page chargée');
        const pdf = await page.pdf({
          width: `${PAGE_WIDTH_MM}mm`,
          height: `${PAGE_HEIGHT_MM}mm`,
          printBackground: true,
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        });
        lap('pdf');
        this.logMemory('PDF généré');
        return Buffer.from(pdf);
      } finally {
        await page.close().catch(() => undefined);
      }
    } finally {
      releaseBrowser();
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