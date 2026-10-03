//backend/src/cards/card-pdf.ts
// v1.1 — nom de l'association en dégradé d'or (comme l'ancienne carte).
// v1.0 — remplace card-template.ts + Puppeteer/Chromium.
// La carte (recto + verso empilés sur une page) est dessinée directement en PDF
// avec pdfkit : aucun navigateur, quelques dizaines de Mo de mémoire seulement,
// génération en une fraction de seconde. Le design reprend celui de l'ancienne
// carte : métal bleu nuit, liseré or, motif guilloche, puce d'empreinte, cadre
// photo, pastille de statut, QR code.
//
// Toutes les coordonnées sont exprimées en millimètres (le document est mis à
// l'échelle une seule fois au début) ; les tailles de police reprennent les
// valeurs en « px » de l'ancien gabarit HTML.
import PDFDocument = require('pdfkit');
import {
  CARD_GAP_MM,
  CARD_HEIGHT_MM,
  CARD_THEME,
  CARD_WIDTH_MM,
  PAGE_HEIGHT_MM,
  PAGE_MARGIN_MM,
  PAGE_WIDTH_MM,
} from './theme';
import { LOGO_DATA_URL } from './logo-data';

export interface CardData {
  firstName: string;
  lastName: string;
  birthYear: number;
  originDistrict: string;
  city: string;
  state: string;
  memberCode: string;
  issuedAt: Date;
  expiresAt: Date;
  photo: Buffer | null; // JPEG ou PNG ; null = pictogramme à la place de la photo
  qrPng: Buffer; // QR code au format PNG
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
}

type Doc = PDFKit.PDFDocument;

const PT_PER_MM = 72 / 25.4;
// Taille de police : « px » CSS -> unités du document (millimètres)
const px = (n: number) => (n * 0.75) / PT_PER_MM;

const t = CARD_THEME;
const LOGO = Buffer.from(LOGO_DATA_URL.slice(LOGO_DATA_URL.indexOf(',') + 1), 'base64');

const REG = 'Helvetica';
const BOLD = 'Helvetica-Bold';

// Dimensions de la face (la carte moins le liseré or de 0,55 mm)
const BORDER = 0.55;
const FACE_W = CARD_WIDTH_MM - BORDER * 2;
const FACE_H = CARD_HEIGHT_MM - BORDER * 2;

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

/**
 * Les polices PDF intégrées gèrent le latin (é, è, ç, ï, ô...). Pour tout autre
 * caractère on retire l'accent si possible, sinon on met « ? » : la carte ne
 * plante jamais à cause d'un nom aux caractères inhabituels.
 */
const LOOKALIKES: Record<string, string> = {
  // Lettres de l'alphabet pulaar/africain, absentes des polices PDF intégrées
  Ɓ: 'B', ɓ: 'b', Ɗ: 'D', ɗ: 'd', Ŋ: 'N', ŋ: 'n', Ɲ: 'N', ɲ: 'n', Ƴ: 'Y', ƴ: 'y',
  Ɛ: 'E', ɛ: 'e', Ɔ: 'O', ɔ: 'o',
};

function safe(value: string | number): string {
  const extra = '’‘“”–—…•€';
  let out = '';
  for (const ch of String(value)) {
    const c = ch.codePointAt(0) as number;
    if (LOOKALIKES[ch]) {
      out += LOOKALIKES[ch];
      continue;
    }
    if ((c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || extra.includes(ch)) {
      out += ch;
      continue;
    }
    const base = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    out += base.length > 0 && base.charCodeAt(0) <= 0x7e && base.charCodeAt(0) >= 0x20 ? base[0] : '?';
  }
  return out;
}

function statusLabel(status: CardData['status']): string {
  switch (status) {
    case 'ACTIVE':
      return 'ACTIF';
    case 'EXPIRING_SOON':
      return 'À RENOUVELER';
    case 'EXPIRED':
      return 'EXPIRÉ';
  }
}

function statusColor(status: CardData['status']): string {
  switch (status) {
    case 'ACTIVE':
      return '#4ADE80';
    case 'EXPIRING_SOON':
      return '#FBBF24';
    case 'EXPIRED':
      return '#F87171';
  }
}

function formatMonthYear(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

/**
 * pdfkit conserve l'opacité d'un remplissage/trait pour tout ce qui suit :
 * ces deux fonctions la remettent à 1 après usage, sinon une ombre à 4 %
 * « délave » tous les dégradés dessinés ensuite.
 */
function fillPath(doc: Doc, paint: string | PDFKit.PDFGradient, alpha = 1): void {
  if (typeof paint === 'string') doc.fillColor(paint, alpha).fill();
  else doc.fillOpacity(1).fill(paint);
  doc.fillOpacity(1);
}

function strokePath(doc: Doc, color: string, alpha: number, width: number): void {
  doc.lineWidth(width).strokeColor(color, alpha).stroke();
  doc.strokeOpacity(1);
}

function rr(doc: Doc, x: number, y: number, w: number, h: number, r: number): Doc {
  return doc.roundedRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}

/** Dégradé linéaire équivalent au `linear-gradient(<angle>deg, ...)` de CSS. */
function cssLinear(doc: Doc, x: number, y: number, w: number, h: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const len = Math.abs(w * dx) + Math.abs(h * dy);
  const cx = x + w / 2;
  const cy = y + h / 2;
  return doc.linearGradient(cx - (dx * len) / 2, cy - (dy * len) / 2, cx + (dx * len) / 2, cy + (dy * len) / 2);
}

function goldGradient(doc: Doc, x: number, y: number, w: number, h: number) {
  return cssLinear(doc, x, y, w, h, 135)
    .stop(0, t.accentGoldLight)
    .stop(0.3, t.accentGold)
    .stop(0.58, t.accentGoldDark)
    .stop(0.82, t.accentGoldLight)
    .stop(1, t.accentGold);
}

/** Ombre portée douce, simulée par quelques couches très transparentes (rendu vectoriel léger). */
function softShadow(doc: Doc, x: number, y: number, w: number, h: number, r: number, dy: number, spread: number, alpha: number) {
  const layers = 8;
  for (let i = 0; i < layers; i++) {
    const e = (spread * (i + 1)) / layers;
    rr(doc, x - e, y + dy - e, w + e * 2, h + e * 2, r + e);
    fillPath(doc, '#000000', alpha / layers);
  }
}

interface TextStyle {
  font?: string;
  size: number; // en « px » CSS
  color: string;
  alpha?: number;
  spacing?: number; // espacement des lettres, en « px » CSS
}

function setStyle(doc: Doc, s: TextStyle) {
  doc.font(s.font ?? REG).fontSize(px(s.size));
}

function spacingMm(s: TextStyle): number {
  return s.spacing ? px(s.spacing) : 0;
}

function widthOf(doc: Doc, str: string, s: TextStyle): number {
  setStyle(doc, s);
  return doc.widthOfString(str, { characterSpacing: spacingMm(s) });
}

function drawText(doc: Doc, str: string, x: number, y: number, s: TextStyle) {
  setStyle(doc, s);
  doc.fillColor(s.color, s.alpha ?? 1).text(str, x, y, { lineBreak: false, characterSpacing: spacingMm(s) });
}

/** Raccourcit un texte avec « … » s'il dépasse la largeur disponible. */
function fitText(doc: Doc, str: string, maxW: number, s: TextStyle): string {
  if (widthOf(doc, str, s) <= maxW) return str;
  let cut = str;
  while (cut.length > 1 && widthOf(doc, `${cut}…`, s) > maxW) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

/** Taille de police (px) réduite jusqu'à ce que le texte tienne dans la largeur. */
function shrinkToFit(doc: Doc, str: string, maxW: number, s: TextStyle, minSize: number): TextStyle {
  let size = s.size;
  while (size > minSize && widthOf(doc, str, { ...s, size }) > maxW) size -= 0.25;
  return { ...s, size };
}

// ---------------------------------------------------------------------------
// Éléments graphiques
// ---------------------------------------------------------------------------

/** Motif « guilloche » : éventail de vagues fines qui s'entrecroisent. */
function drawGuilloche(doc: Doc, top: number) {
  const H = 6;
  const lines = 18;
  const steps = 140;
  doc.save();
  doc.lineJoin('round').lineWidth(0.11);
  for (let i = 0; i < lines; i++) {
    const amp = 0.5 + i * 0.12;
    const phase = i * 0.27;
    const even = i % 2 === 0;
    for (let s = 0; s <= steps; s++) {
      const x = (s / steps) * FACE_W;
      const y = top + H / 2 + amp * Math.sin((x / FACE_W) * Math.PI * 2 * 3.4 + phase);
      if (s === 0) doc.moveTo(x, y);
      else doc.lineTo(x, y);
    }
    doc.strokeColor(even ? '#E3C677' : '#8FC3E3', even ? 0.36 : 0.24).stroke();
  }
  doc.restore();
}

/** Reflet diagonal et grain de métal brossé. */
function drawMetalSheen(doc: Doc) {
  const g = cssLinear(doc, 0, 0, FACE_W, FACE_H, 112)
    .stop(0, '#ffffff', 0)
    .stop(0.28, '#ffffff', 0)
    .stop(0.44, '#ffffff', 0.11)
    .stop(0.54, '#ffffff', 0.03)
    .stop(0.66, '#ffffff', 0)
    .stop(1, '#ffffff', 0);
  doc.rect(0, 0, FACE_W, FACE_H).fill(g);

  doc.save();
  doc.fillColor('#ffffff', 0.028);
  for (let x = 0; x < FACE_W; x += 0.4) {
    doc.rect(x, 0, 0.15, FACE_H);
  }
  doc.fill();
  doc.restore();
}

function drawFaceBackground(doc: Doc) {
  const base = cssLinear(doc, 0, 0, FACE_W, FACE_H, 145)
    .stop(0, '#0d4a70')
    .stop(0.48, t.primaryDark)
    .stop(1, t.primaryDeep);
  doc.rect(0, 0, FACE_W, FACE_H).fill(base);

  const cx = FACE_W * 0.85;
  const glow = doc
    .radialGradient(cx, 0, 0, cx, 0, 42)
    .stop(0, t.primary, 0.95)
    .stop(1, t.primary, 0);
  doc.rect(0, 0, FACE_W, FACE_H).fill(glow);

  drawMetalSheen(doc);
}

/** Cadre or arrondi contenant `draw` (le contenu est rogné aux coins arrondis). */
function drawCircleImage(doc: Doc, cx: number, cy: number, d: number, ring: number) {
  doc.circle(cx, cy, d / 2 + ring).fillColor(t.accentGold, 1).fill();
  doc.save();
  doc.circle(cx, cy, d / 2).clip();
  doc.image(LOGO, cx - d / 2, cy - d / 2, { width: d, height: d });
  doc.restore();
}

const FINGERPRINT_PATHS = [
  'M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4',
  'M14 13.12c0 2.38 0 6.38-1 8.88',
  'M17.29 21.02c.12-.6.43-2.3.5-3.02',
  'M2 12a10 10 0 0 1 18-6',
  'M2 16h.01',
  'M21.8 16c.2-2 .131-5.354 0-6',
  'M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2',
  'M8.65 22c.21-.66.45-1.32.57-2',
  'M9 6.8a6 6 0 0 1 9 5.2v2',
];

function drawFingerprintChip(doc: Doc, x: number, y: number, size: number) {
  const r = size / 2;
  doc.circle(x + r, y + r, r);
  fillPath(doc, '#ffffff', 0.07);
  doc.circle(x + r, y + r, r - 0.125);
  strokePath(doc, '#E3C677', 0.65, 0.25);

  const inner = size - 2 * 1.55;
  doc.save();
  doc.translate(x + 1.55, y + 1.55).scale(inner / 24);
  doc.lineWidth(1.3).lineCap('round').lineJoin('round').strokeColor(t.accentGold, 1);
  for (const d of FINGERPRINT_PATHS) doc.path(d).stroke();
  doc.restore();
}

function drawPin(doc: Doc, x: number, y: number, size: number) {
  doc.save();
  doc.translate(x, y).scale(size / 24);
  doc
    .path('M12 1.8c-4.1 0-7.4 3.2-7.4 7.2 0 5.4 7.4 13.2 7.4 13.2s7.4-7.8 7.4-13.2c0-4-3.3-7.2-7.4-7.2z')
    .lineWidth(1.1)
    .strokeColor('#E3C677', 1)
    .stroke();
  doc.circle(12, 8.2, 2.5).fillColor('#E3C677', 1).fill();
  doc
    .path('M7.6 14.2c.9-2 2.6-3 4.4-3s3.5 1 4.4 3c-1.2 1.6-2.7 2.8-4.4 4.5-1.7-1.7-3.2-2.9-4.4-4.5z')
    .fillColor('#E3C677', 0.85)
    .fill();
  doc.restore();
}

function drawStatusPill(doc: Doc, status: CardData['status']): number {
  const label = statusLabel(status);
  const style: TextStyle = { font: BOLD, size: 6.2, color: '#ffffff', spacing: 0.6 };
  const textW = widthOf(doc, label, style);
  const dot = 1.5;
  const lineH = px(6.2) * 1.15;
  const w = 2 + dot + 1.2 + textW + 2.6 + 0.5;
  const h = lineH + 1.8 + 0.5;
  const x = FACE_W - 4 - w;
  const y = 4.6;

  rr(doc, x, y, w, h, 10);
  fillPath(doc, '#ffffff', 0.12);
  rr(doc, x + 0.125, y + 0.125, w - 0.25, h - 0.25, 10);
  strokePath(doc, '#ffffff', 0.5, 0.25);

  const dotX = x + 0.25 + 2 + dot / 2;
  const dotY = y + h / 2;
  const color = statusColor(status);
  doc.circle(dotX, dotY, dot / 2 + 0.55);
  fillPath(doc, color, 0.3);
  doc.circle(dotX, dotY, dot / 2);
  fillPath(doc, color, 1);

  drawText(doc, label, x + 0.25 + 2 + dot + 1.2, y + 0.25 + 0.9, style);
  return x;
}

function drawPhotoFrame(doc: Doc, photo: Buffer | null) {
  const x = 4;
  const y = 15.2;
  const w = 20;
  const h = 24.5;
  softShadow(doc, x, y, w, h, 2.2, 0.8, 1.6, 0.3);
  rr(doc, x, y, w, h, 2.2);
  fillPath(doc, goldGradient(doc, x, y, w, h));

  const ix = x + 0.5;
  const iy = y + 0.5;
  const iw = w - 1;
  const ih = h - 1;
  rr(doc, ix, iy, iw, ih, 1.8).fill(
    cssLinear(doc, ix, iy, iw, ih, 160).stop(0, '#14618d').stop(0.55, '#0a3a56').stop(1, '#072c42'),
  );

  let drawn = false;
  if (photo) {
    doc.save();
    try {
      rr(doc, ix, iy, iw, ih, 1.8).clip();
      doc.image(photo, ix, iy, { cover: [iw, ih], align: 'center', valign: 'center' });
      drawn = true;
    } catch {
      // format d'image non pris en charge : on affichera le pictogramme
    } finally {
      doc.restore();
    }
  }
  if (!drawn) drawPin(doc, ix + (iw - 13) / 2, iy + (ih - 13) / 2, 13);
}

function drawQr(doc: Doc, qr: Buffer, x: number, y: number, size: number, pad: number, innerPad: number, rOuter: number, rInner: number) {
  softShadow(doc, x, y, size, size, rOuter, 0.6, 1.2, 0.3);
  rr(doc, x, y, size, size, rOuter);
  fillPath(doc, goldGradient(doc, x, y, size, size));
  const ix = x + pad;
  const iy = y + pad;
  const is = size - pad * 2;
  rr(doc, ix, iy, is, is, rInner).fillColor('#ffffff', 1).fill();
  doc.image(qr, ix + innerPad, iy + innerPad, { width: is - innerPad * 2, height: is - innerPad * 2 });
}

function drawFooterBand(doc: Doc, height: number) {
  const y = FACE_H - height;
  doc.rect(0, y, FACE_W, height);
  fillPath(doc, cssLinear(doc, 0, y, FACE_W, height, 180).stop(0, '#06263A', 0.55).stop(1, '#06263A', 0.9));
  doc.rect(0, y, FACE_W, 0.25);
  fillPath(doc, '#E3C677', 0.6);
}

// ---------------------------------------------------------------------------
// Recto
// ---------------------------------------------------------------------------

function drawRecto(doc: Doc, data: CardData) {
  drawFaceBackground(doc);
  drawGuilloche(doc, FACE_H - 11.5 - 6);

  // En-tête : logo + nom de l'association
  drawCircleImage(doc, 4 + 9.5 / 2, 3.2 + 9.5 / 2, 9.5, 0.3);
  // Nom de l'association : texte rempli avec le dégradé d'or
  const brand = safe(t.associationName);
  const brandStyle: TextStyle = { font: BOLD, size: 9, color: t.accentGoldLight, spacing: 1.1 };
  const brandW = widthOf(doc, brand, brandStyle);
  const brandH = px(9) * 1.15;
  setStyle(doc, brandStyle);
  doc
    .fillColor(goldGradient(doc, 15.9, 5.57, brandW, brandH) as unknown as string, 1)
    .text(brand, 15.9, 5.57, { lineBreak: false, characterSpacing: spacingMm(brandStyle) });
  doc.fillOpacity(1);
  drawText(doc, 'CARTE DE MEMBRE', 15.9, 8.81, { size: 5, color: '#ffffff', alpha: 0.72, spacing: 1.5 });

  // La puce d'empreinte se décale vers la gauche si la pastille de statut est large
  const pillX = drawStatusPill(doc, data.status);
  drawFingerprintChip(doc, Math.min(FACE_W - 26 - 7.2, pillX - 1.5 - 7.2), 4.2, 7.2);
  drawPhotoFrame(doc, data.photo);

  // Informations du membre
  const infoX = 28.5;
  const infoW = FACE_W - infoX - 4;
  let y = 15;
  drawText(doc, 'MEMBRE ADHÉRENT', infoX, y, { font: BOLD, size: 5.4, color: t.accentGold, spacing: 1.4 });
  y += px(5.4) * 1.15 + 0.7;

  const fullName = safe(`${data.firstName} ${data.lastName.toUpperCase()}`);
  const nameStyle = shrinkToFit(doc, fullName, infoW, { font: BOLD, size: 11.5, color: '#ffffff', spacing: 0.2 }, 7);
  drawText(doc, fullName, infoX, y, nameStyle);
  y += px(11.5) * 1.12 + 0.9;

  rr(doc, infoX, y, 14, 0.3, 0.15);
  fillPath(doc, goldGradient(doc, infoX, y, 14, 0.3));
  y += 0.3 + 1.9;

  const rows: Array<[string, string]> = [
    ['NÉ(E) EN', safe(data.birthYear)],
    ['ORIGINE', safe(data.originDistrict)],
    ['RÉSIDENCE', safe(`${data.city}, ${data.state}`)],
  ];
  const valueStyle: TextStyle = { font: BOLD, size: 7, color: '#ffffff' };
  const rowH = px(7) * 1.15;
  for (const [label, value] of rows) {
    drawText(doc, label, infoX, y + 0.35, { size: 5.1, color: '#ffffff', alpha: 0.62, spacing: 0.7 });
    drawText(doc, fitText(doc, value, infoW - 15, valueStyle), infoX + 15, y, valueStyle);
    y += rowH + 1.35;
  }

  // Pied de carte : identifiant + expiration
  drawFooterBand(doc, 11.5);
  const kStyle: TextStyle = { size: 4.8, color: '#ffffff', alpha: 0.58, spacing: 1 };
  const idStyle: TextStyle = { font: BOLD, size: 8.2, color: t.accentGoldLight, spacing: 1 };
  const expStyle: TextStyle = { font: BOLD, size: 8.2, color: '#ffffff', spacing: 1 };
  const blockH = px(4.8) * 1.15 + 0.4 + px(8.2) * 1.15;
  const blockY = FACE_H - 11.5 + 0.25 + (11.25 - blockH) / 2;
  const kH = px(4.8) * 1.15 + 0.4;
  const idLabel = 'N° IDENTIFIANT';
  const code = safe(data.memberCode);
  drawText(doc, idLabel, 4, blockY, kStyle);
  drawText(doc, code, 4, blockY + kH, idStyle);
  const idW = Math.max(widthOf(doc, idLabel, kStyle), widthOf(doc, code, idStyle));
  const expX = 4 + idW + 9;
  drawText(doc, 'EXPIRE FIN', expX, blockY, kStyle);
  drawText(doc, formatMonthYear(data.expiresAt), expX, blockY + kH, expStyle);

  drawQr(doc, data.qrPng, FACE_W - 3.6 - 14.5, FACE_H - 3 - 14.5, 14.5, 0.4, 0.9, 1.8, 1.4);
}

// ---------------------------------------------------------------------------
// Verso
// ---------------------------------------------------------------------------

function drawVerso(doc: Doc, data: CardData) {
  drawFaceBackground(doc);
  drawGuilloche(doc, FACE_H - 9 - 6);

  // Cadre intérieur fin
  rr(doc, 1.6 + 0.1, 1.6 + 0.1, FACE_W - 3.2 - 0.2, FACE_H - 3.2 - 0.2, 2);
  strokePath(doc, '#E3C677', 0.45, 0.2);

  const usable = FACE_H - 9;

  // Colonne gauche : grand logo + légende
  const captionStyle: TextStyle = { font: BOLD, size: 5.4, color: t.accentGoldLight, spacing: 1.6 };
  const captionH = px(5.4) * 1.15;
  const leftH = 24 + 3 + captionH;
  const leftTop = (usable - leftH) / 2;
  const leftCx = 5 + 31 / 2;
  drawCircleImage(doc, leftCx, leftTop + 12, 24, 0.4);
  const cap = 'CARTE DE MEMBRE';
  drawText(doc, cap, leftCx - widthOf(doc, cap, captionStyle) / 2, leftTop + 24 + 3, captionStyle);

  // Séparateur vertical dégradé
  const divH = FACE_H - 7 - 14;
  doc
    .rect(40, 7, 0.25, divH)
    .fill(
      doc
        .linearGradient(0, 7, 0, 7 + divH)
        .stop(0, '#E3C677', 0)
        .stop(0.5, '#E3C677', 0.8)
        .stop(1, '#E3C677', 0),
    );

  // Colonne droite : QR code + texte de vérification
  const rightX = 43;
  const rightW = FACE_W - 5 - rightX;
  const rightCx = rightX + rightW / 2;
  const lineH = px(5.4) * 1.45;
  const rightH = 27 + 2.4 + lineH * 2;
  const rightTop = (usable - rightH) / 2;
  drawQr(doc, data.qrPng, rightCx - 13.5, rightTop, 27, 0.5, 1.6, 2.4, 1.9);

  const regular: TextStyle = { size: 5.4, color: '#ffffff', alpha: 0.88, spacing: 0.2 };
  const bold: TextStyle = { font: BOLD, size: 5.4, color: t.accentGoldLight, spacing: 0.2 };
  const p1 = 'Scannez ce code pour ';
  const p2 = 'vérifier l’authenticité';
  const p3 = 'de cette carte de membre.';
  const w1 = widthOf(doc, p1, regular);
  const w2 = widthOf(doc, p2, bold);
  const textY = rightTop + 27 + 2.4;
  const startX = rightCx - (w1 + w2) / 2;
  drawText(doc, p1, startX, textY, regular);
  drawText(doc, p2, startX + w1, textY, bold);
  drawText(doc, p3, rightCx - widthOf(doc, p3, regular) / 2, textY + lineH, regular);

  // Bandeau bas : identifiant + expiration
  drawFooterBand(doc, 9);
  const codeStyle: TextStyle = { font: BOLD, size: 6.2, color: '#ffffff', spacing: 1 };
  const expStyle: TextStyle = { font: BOLD, size: 6.2, color: t.accentGoldLight, spacing: 1 };
  const code = `${safe(data.memberCode)} · `;
  const exp = `Expire fin ${formatMonthYear(data.expiresAt)}`;
  const wCode = widthOf(doc, code, codeStyle);
  const wExp = widthOf(doc, exp, expStyle);
  const textTop = FACE_H - 9 + 0.25 + (8.75 - px(6.2) * 1.15) / 2;
  const x0 = (FACE_W - wCode - wExp) / 2;
  drawText(doc, code, x0, textTop, codeStyle);
  drawText(doc, exp, x0 + wCode, textTop, expStyle);
}

// ---------------------------------------------------------------------------
// Page complète
// ---------------------------------------------------------------------------

function drawCard(doc: Doc, ox: number, oy: number, paint: () => void) {
  // Ombre, liseré or, puis face rognée aux coins arrondis
  softShadow(doc, ox, oy, CARD_WIDTH_MM, CARD_HEIGHT_MM, 3.2, 1, 3, 0.22);
  rr(doc, ox, oy, CARD_WIDTH_MM, CARD_HEIGHT_MM, 3.2);
  fillPath(doc, goldGradient(doc, ox, oy, CARD_WIDTH_MM, CARD_HEIGHT_MM));

  doc.save();
  doc.translate(ox + BORDER, oy + BORDER);
  rr(doc, 0, 0, FACE_W, FACE_H, 2.7).clip();
  paint();
  doc.restore();
}

/**
 * Génère le PDF de la carte : recto et verso empilés sur une seule page, avec
 * une marge autour (mêmes dimensions que l'ancien rendu Chromium).
 */
export function renderMemberCardPdf(data: CardData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [PAGE_WIDTH_MM * PT_PER_MM, PAGE_HEIGHT_MM * PT_PER_MM],
        margin: 0,
        info: { Title: `Carte de membre ${safe(data.memberCode)}`, Author: safe(t.associationName) },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.scale(PT_PER_MM);

      // Fond de page
      doc.rect(0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM).fillColor('#e9eef2', 1).fill();

      drawCard(doc, PAGE_MARGIN_MM, PAGE_MARGIN_MM, () => drawRecto(doc, data));
      drawCard(doc, PAGE_MARGIN_MM, PAGE_MARGIN_MM + CARD_HEIGHT_MM + CARD_GAP_MM, () => drawVerso(doc, data));

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}