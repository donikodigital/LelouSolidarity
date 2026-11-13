//backend/src/admin-profile/members-pdf.ts
// Export de la liste des membres en PDF (A4 paysage) : un document propre à imprimer ou à
// transmettre, avec en-tête aux couleurs de l'association, tableau en zébrures, pagination
// et mention « confidentiel ». Dessiné avec pdfkit (aucun navigateur), comme la carte.
// Les textes passent par safe() : un nom aux caractères inhabituels ne fait jamais échouer le PDF.
import PDFDocument = require('pdfkit');
import { safe } from '../cards/card-pdf';
import { LOGO_DATA_URL } from '../cards/logo-data';
import { Locale } from '../common/i18n';
import { positionLabel } from '../common/positions';
import { THEME } from '../common/theme';

export interface PdfMember {
  memberCode: string | null;
  firstName: string;
  lastName: string;
  birthDate: Date;
  originDistrict: string;
  position: string;
  positionOther: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  status: string;
  cardStatus: string;
  cardExpiresAt: Date | null;
}

const LOGO = Buffer.from(LOGO_DATA_URL.slice(LOGO_DATA_URL.indexOf(',') + 1), 'base64');

const PAGE_W = 841.89; // A4 paysage, en points
const PAGE_H = 595.28;
const MARGIN = 28;
const ROW_H = 18;
const HEAD_H = 20;
const FOOTER_H = 30;
const FIRST_TOP = 112; // sous l'en-tête de la première page
const NEXT_TOP = 52; // sous le bandeau des pages suivantes

const TEXT = {
  fr: {
    title: 'Liste des membres',
    generated: 'Édité le {date}',
    total: '{n} membre(s)',
    active: 'cartes actives',
    renew: 'à renouveler',
    expired: 'expirées',
    pending: 'en attente',
    confidential: 'Document confidentiel : contient des données personnelles.',
    page: 'Page {n} / {total}',
    empty: 'Aucun membre enregistré.',
    columns: ['N°', 'Nom et prénom', 'Naiss.', 'Localité', 'Résidence', 'Téléphone', 'Poste', 'E-mail', 'Carte'],
    cardStatus: { NONE: 'Aucune', ACTIVE: 'Active', EXPIRING_SOON: 'À renouveler', EXPIRED: 'Expirée' } as Record<string, string>,
    pendingStatus: 'En attente',
    expiresShort: 'exp.',
  },
  en: {
    title: 'Members list',
    generated: 'Generated on {date}',
    total: '{n} member(s)',
    active: 'active cards',
    renew: 'to renew',
    expired: 'expired',
    pending: 'pending',
    confidential: 'Confidential document: contains personal data.',
    page: 'Page {n} / {total}',
    empty: 'No members registered.',
    columns: ['ID', 'Name', 'Born', 'Locality', 'Residence', 'Phone', 'Position', 'E-mail', 'Card'],
    cardStatus: { NONE: 'None', ACTIVE: 'Active', EXPIRING_SOON: 'To renew', EXPIRED: 'Expired' } as Record<string, string>,
    pendingStatus: 'Pending',
    expiresShort: 'exp.',
  },
};

// Largeurs des colonnes (points) : total = PAGE_W - 2 * MARGIN
const COL_W = [60, 130, 34, 74, 96, 82, 88, 147.89, 74];

const fill = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));

function fmtDate(date: Date, lang: 'fr' | 'en'): string {
  const d = String(date.getUTCDate()).padStart(2, '0');
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const y = date.getUTCFullYear();
  return lang === 'fr' ? `${d}/${m}/${y}` : `${m}/${d}/${y}`;
}

/** Coupe le texte avec « … » pour qu'il tienne dans la largeur donnée. */
function fit(doc: PDFKit.PDFDocument, text: string, width: number): string {
  if (doc.widthOfString(text) <= width) return text;
  let out = text;
  while (out.length > 1 && doc.widthOfString(`${out}…`) > width) out = out.slice(0, -1);
  return `${out.trimEnd()}…`;
}

function drawTableHead(doc: PDFKit.PDFDocument, y: number, columns: string[]) {
  doc.rect(MARGIN, y, PAGE_W - 2 * MARGIN, HEAD_H).fillColor(THEME.primaryDark).fill();
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#FFFFFF');
  let x = MARGIN;
  columns.forEach((label, i) => {
    doc.text(safe(label).toUpperCase(), x + 5, y + 6.5, { width: COL_W[i] - 8, lineBreak: false });
    x += COL_W[i];
  });
  // liseré or sous l'en-tête du tableau
  doc.rect(MARGIN, y + HEAD_H, PAGE_W - 2 * MARGIN, 1.2).fillColor(THEME.accentGold).fill();
}

function drawBanner(doc: PDFKit.PDFDocument, first: boolean, title: string, subtitle: string) {
  const h = first ? 84 : 34;
  doc.rect(0, 0, PAGE_W, h).fillColor(THEME.primaryDeep).fill();
  doc.rect(0, h, PAGE_W, 2.5).fillColor(THEME.accentGold).fill();
  if (first) {
    doc.circle(MARGIN + 25, 42, 27).fillColor(THEME.accentGold).fill();
    doc.image(LOGO, MARGIN + 3, 20, { width: 44, height: 44 });
    doc.font('Helvetica-Bold').fontSize(9).fillColor(THEME.accentGoldLight)
      .text(safe(THEME.associationName), MARGIN + 66, 24, { characterSpacing: 2, lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#FFFFFF').text(safe(title), MARGIN + 66, 38, { lineBreak: false });
    doc.font('Helvetica').fontSize(8.5).fillColor('#C9D8E2')
      .text(safe(subtitle), PAGE_W - MARGIN - 300, 31, { width: 300, align: 'right', lineBreak: false });
  } else {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(THEME.accentGoldLight)
      .text(safe(`${THEME.associationName}  -  ${title}`), MARGIN, 13, { characterSpacing: 1, lineBreak: false });
  }
}

export function renderMembersPdf(members: PdfMember[], locale: Locale, now = new Date()): Promise<Buffer> {
  const lang: 'fr' | 'en' = locale === 'en' ? 'en' : 'fr';
  const tx = TEXT[lang];

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [PAGE_W, PAGE_H],
        margin: 0,
        bufferPages: true,
        info: { Title: safe(`${tx.title} - ${THEME.associationName}`), Author: safe(THEME.associationName) },
      });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Tri alphabétique (nom puis prénom) : plus lisible sur papier qu'un tri par date d'inscription
      const sorted = [...members].sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName, lang, { sensitivity: 'base' }) ||
          a.firstName.localeCompare(b.firstName, lang, { sensitivity: 'base' }),
      );

      const count = (status: string) => sorted.filter((m) => m.cardStatus === status).length;
      const pending = sorted.filter((m) => m.status === 'PENDING').length;
      const summary =
        `${fill(tx.total, { n: sorted.length })}  -  ${count('ACTIVE')} ${tx.active}  -  ` +
        `${count('EXPIRING_SOON')} ${tx.renew}  -  ${count('EXPIRED')} ${tx.expired}  -  ${pending} ${tx.pending}`;

      drawBanner(doc, true, tx.title, fill(tx.generated, { date: fmtDate(now, lang) }));
      doc.font('Helvetica-Bold').fontSize(9).fillColor(THEME.primaryDark).text(safe(summary), MARGIN, 94, { lineBreak: false });

      let y = FIRST_TOP - HEAD_H - 4;
      drawTableHead(doc, y, tx.columns);
      y += HEAD_H + 3;

      if (sorted.length === 0) {
        doc.font('Helvetica-Oblique').fontSize(10).fillColor('#5B7686').text(safe(tx.empty), MARGIN, y + 14, { lineBreak: false });
      }

      sorted.forEach((m, index) => {
        if (y + ROW_H > PAGE_H - FOOTER_H) {
          doc.addPage({ size: [PAGE_W, PAGE_H], margin: 0 });
          drawBanner(doc, false, tx.title, '');
          y = NEXT_TOP;
          drawTableHead(doc, y, tx.columns);
          y += HEAD_H + 3;
        }

        if (index % 2 === 0) doc.rect(MARGIN, y, PAGE_W - 2 * MARGIN, ROW_H).fillColor('#F1F6F9').fill();

        const card =
          m.status === 'PENDING' ? tx.pendingStatus : tx.cardStatus[m.cardStatus] ?? m.cardStatus;
        const expires = m.cardExpiresAt && m.status !== 'PENDING' ? ` ${fmtDate(m.cardExpiresAt, lang)}` : '';
        const cells = [
          m.memberCode ?? '-',
          `${m.lastName.toUpperCase()} ${m.firstName}`,
          String(m.birthDate.getUTCFullYear()),
          m.originDistrict,
          [m.city, m.state].filter(Boolean).join(', '),
          m.phone,
          positionLabel(m.position, m.positionOther, lang),
          m.email,
          card,
        ];

        let x = MARGIN;
        cells.forEach((value, i) => {
          const bold = i === 1;
          doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5).fillColor(THEME.primaryDeep);
          // Colonne « Carte » sur deux lignes (statut + date d'expiration), les autres centrées
          const textY = i === 8 && expires ? y + 3.6 : y + 5.5;
          doc.text(fit(doc, safe(value), COL_W[i] - 9), x + 5, textY, { width: COL_W[i] - 7, lineBreak: false });
          x += COL_W[i];
        });
        // Date d'expiration en petit sous le statut de la carte
        if (expires) {
          doc.font('Helvetica').fontSize(5.5).fillColor('#5B7686')
            .text(safe(`${tx.expiresShort} ${expires.trim()}`), x - COL_W[8] + 5, y + 11.8, { width: COL_W[8] - 6, lineBreak: false });
        }
        y += ROW_H;
      });

      // Pied de page de chaque page : mention de confidentialité + pagination
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(range.start + i);
        doc.rect(MARGIN, PAGE_H - FOOTER_H + 6, PAGE_W - 2 * MARGIN, 0.6).fillColor('#C9D8E2').fill();
        doc.font('Helvetica').fontSize(7).fillColor('#5B7686');
        doc.text(safe(tx.confidential), MARGIN, PAGE_H - FOOTER_H + 12, { lineBreak: false });
        doc.text(safe(fill(tx.page, { n: i + 1, total: range.count })), PAGE_W - MARGIN - 120, PAGE_H - FOOTER_H + 12, {
          width: 120,
          align: 'right',
          lineBreak: false,
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
