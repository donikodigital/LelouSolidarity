//backend/src/cards/card-pdf.ts
// v2.2 — consignes du client : lignes « Téléphone, Localité, Résidence, Poste » (la localité est
// le lieu d'origine, ex. Lelouma) ; « DEPUIS » reprend l'année de THEME.foundedYear.
// v2.1 — mention « DEPUIS 2021 » (année de création de l'association) sous le titre.
// v2.0 — REFONTE : badge « tour de cou » en PORTRAIT (CR80 vertical), une seule
// face (plus de verso, plus de drapeaux). Le verso (QR code + texte de
// vérification) est intégré au recto. Une fente de cordon est dessinée en haut.
// Couleurs de la charte : bleu océan, or, vagues.
// v1.4 — carte en français ou en anglais selon la langue du membre (`locale`).
// La carte est dessinée directement en PDF avec pdfkit : aucun navigateur,
// quelques dizaines de Mo de mémoire, génération en une fraction de seconde.
//
// Toutes les coordonnées sont exprimées en millimètres (le document est mis à
// l'échelle une seule fois au début) ; les tailles de police sont en « px » CSS.
import PDFDocument = require('pdfkit');
import {
  CARD_HEIGHT_MM,
  CARD_THEME,
  CARD_WIDTH_MM,
  PAGE_HEIGHT_MM,
  PAGE_MARGIN_MM,
  PAGE_WIDTH_MM,
} from './theme';
import { LOGO_DATA_URL } from './logo-data';
import { parsePhone } from '../common/phone';
import { Locale } from '../common/i18n';
import { positionLabel } from '../common/positions';

export interface CardData {
  firstName: string;
  lastName: string;
  phone: string;
  originDistrict: string;
  originLocality: string;
  /** Code du poste (MEMBER, PRESIDENT, ... OTHER) et texte libre associé à « OTHER ». */
  position: string;
  positionOther: string;
  city: string;
  state: string;
  memberCode: string;
  issuedAt: Date;
  expiresAt: Date;
  photo: Buffer | null; // JPEG ou PNG ; null = pictogramme à la place de la photo
  qrPng: Buffer; // QR code au format PNG
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  /** Langue des textes imprimés sur la carte (français par défaut). */
  locale?: Locale;
}

type Doc = PDFKit.PDFDocument;

// Textes imprimés sur la carte, par langue
const CARD_TEXTS: Record<
  Locale,
  {
    status: Record<CardData['status'], string>;
    cardTitle: string;
    since: string;
    memberBadge: string;
    phone: string;
    locality: string;
    residence: string;
    position: string;
    memberId: string;
    expiresEnd: string;
    scanPrefix: string;
    scanBold: string;
    scanSuffix: string;
    pdfTitle: string;
  }
> = {
  fr: {
    status: { ACTIVE: 'ACTIF', EXPIRING_SOON: 'À RENOUVELER', EXPIRED: 'EXPIRÉ' },
    cardTitle: 'CARTE DE MEMBRE',
    since: 'DEPUIS',
    memberBadge: 'MEMBRE ADHÉRENT',
    phone: 'TÉLÉPHONE',
    locality: 'LOCALITÉ',
    residence: 'RÉSIDENCE',
    position: 'POSTE',
    memberId: 'N° IDENTIFIANT',
    expiresEnd: 'EXPIRE FIN',
    scanPrefix: 'Scannez ce code pour ',
    scanBold: 'vérifier l’authenticité',
    scanSuffix: ' de cette carte de membre.',
    pdfTitle: 'Carte de membre',
  },
  en: {
    status: { ACTIVE: 'ACTIVE', EXPIRING_SOON: 'RENEW SOON', EXPIRED: 'EXPIRED' },
    cardTitle: 'MEMBERSHIP CARD',
    since: 'SINCE',
    memberBadge: 'MEMBER',
    phone: 'PHONE',
    locality: 'LOCALITY',
    residence: 'RESIDENCE',
    position: 'POSITION',
    memberId: 'MEMBER ID',
    expiresEnd: 'EXPIRES',
    scanPrefix: 'Scan this code to ',
    scanBold: 'verify the authenticity',
    scanSuffix: ' of this membership card.',
    pdfTitle: 'Membership card',
  },
  // Pular (Fuuta Jallon) — à faire relire. Les lettres ɓ/ɗ sont remplacées par b/d
  // à l'impression (police Helvetica, voir safe()).
  ff: {
    status: { ACTIVE: 'E HUUWUGO', EXPIRING_SOON: 'HESƊITINA', EXPIRED: 'TIMMII' },
    cardTitle: 'KARTE KAWTAAƊO',
    since: 'DIGA',
    memberBadge: 'KAWTAAƊO',
    phone: 'TELEFON',
    locality: 'SAARE',
    residence: 'HOƊORDE',
    position: 'POSTE',
    memberId: 'LIMNGAL KARTE',
    expiresEnd: 'TIMMOTO',
    scanPrefix: 'Wanngu QR code ngoo ngam ',
    scanBold: 'hoolaago karte',
    scanSuffix: ' kawtaaɗo ndee.',
    pdfTitle: 'Karte kawtaaɗo',
  },
};

// Les libellés passent par safe() (lettres ɓ/ɗ... absentes de Helvetica) ; résultat mis en cache.
type CardTexts = (typeof CARD_TEXTS)[Locale];
const SAFE_TEXTS = new Map<Locale, CardTexts>();
function textsOf(data: CardData): CardTexts {
  const locale = data.locale ?? 'fr';
  let cached = SAFE_TEXTS.get(locale);
  if (!cached) {
    const src = CARD_TEXTS[locale];
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(src)) {
      out[k] =
        typeof v === 'string'
          ? safe(v)
          : Object.fromEntries(Object.entries(v as Record<string, string>).map(([a, b]) => [a, safe(b)]));
    }
    cached = out as unknown as CardTexts;
    SAFE_TEXTS.set(locale, cached);
  }
  return cached;
}

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
const CX = FACE_W / 2;

// Bleus et teintes complémentaires de la charte
const OCEAN_LIGHT = '#8FC3E3';
const GOLD_SOFT = '#E3C677';
const PAGE_BG = '#e9eef2';

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
    const base = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    out += base.length > 0 && base.charCodeAt(0) <= 0x7e && base.charCodeAt(0) >= 0x20 ? base[0] : '?';
  }
  return out;
}

function statusLabel(data: CardData): string {
  return textsOf(data).status[data.status];
}

function statusColor(status: CardData['status'], onLight: boolean): string {
  switch (status) {
    case 'ACTIVE':
      return onLight ? '#16A34A' : '#4ADE80';
    case 'EXPIRING_SOON':
      return onLight ? '#D97706' : '#FBBF24';
    case 'EXPIRED':
      return onLight ? '#DC2626' : '#F87171';
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

/** Texte centré horizontalement sur `cx` ; renvoie la hauteur de la ligne. */
function drawCentered(doc: Doc, str: string, cx: number, y: number, s: TextStyle): number {
  drawText(doc, str, cx - widthOf(doc, str, s) / 2, y, s);
  return lineHeight(s);
}

/** Hauteur d'une ligne (mm) pour une taille de police donnée. */
function lineHeight(s: TextStyle): number {
  return px(s.size) * 1.15;
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
// Éléments graphiques communs
// ---------------------------------------------------------------------------

/** Remplit la zone située sous (ou au-dessus de) une vague sinusoïdale pleine largeur. */
function fillWave(
  doc: Doc,
  base: number,
  amp: number,
  cycles: number,
  phase: number,
  side: 'below' | 'above',
  paint: string | PDFKit.PDFGradient,
  alpha = 1,
) {
  const steps = 80;
  for (let s = 0; s <= steps; s++) {
    const x = (s / steps) * FACE_W;
    const y = base + amp * Math.sin((x / FACE_W) * Math.PI * 2 * cycles + phase);
    if (s === 0) doc.moveTo(x, y);
    else doc.lineTo(x, y);
  }
  const edge = side === 'below' ? FACE_H : 0;
  doc.lineTo(FACE_W, edge).lineTo(0, edge).closePath();
  fillPath(doc, paint, alpha);
}

/** Simple ligne ondulée (liseré) pleine largeur. */
function strokeWave(
  doc: Doc,
  base: number,
  amp: number,
  cycles: number,
  phase: number,
  color: string,
  alpha: number,
  width: number,
) {
  const steps = 80;
  for (let s = 0; s <= steps; s++) {
    const x = (s / steps) * FACE_W;
    const y = base + amp * Math.sin((x / FACE_W) * Math.PI * 2 * cycles + phase);
    if (s === 0) doc.moveTo(x, y);
    else doc.lineTo(x, y);
  }
  strokePath(doc, color, alpha, width);
}

/** Motif « guilloche » : éventail de vagues fines qui s'entrecroisent. */
function drawGuilloche(
  doc: Doc,
  top: number,
  height: number,
  colors: [string, string],
  alphas: [number, number],
  lines = 18,
) {
  const steps = 140;
  doc.save();
  doc.lineJoin('round').lineWidth(0.11);
  for (let i = 0; i < lines; i++) {
    const amp = 0.5 + (i * height) / lines / 6 * 0.72;
    const phase = i * 0.27;
    const even = i % 2 === 0;
    for (let s = 0; s <= steps; s++) {
      const x = (s / steps) * FACE_W;
      const y = top + height / 2 + amp * Math.sin((x / FACE_W) * Math.PI * 2 * 3.4 + phase);
      if (s === 0) doc.moveTo(x, y);
      else doc.lineTo(x, y);
    }
    doc.strokeColor(even ? colors[0] : colors[1], even ? alphas[0] : alphas[1]).stroke();
  }
  doc.restore();
}

/** Logo rond cerclé d'or. */
function drawCircleImage(doc: Doc, cx: number, cy: number, d: number, ring: number) {
  doc.circle(cx, cy, d / 2 + ring);
  fillPath(doc, goldGradient(doc, cx - d / 2 - ring, cy - d / 2 - ring, d + ring * 2, d + ring * 2));
  doc.save();
  doc.circle(cx, cy, d / 2).clip();
  doc.image(LOGO, cx - d / 2, cy - d / 2, { width: d, height: d });
  doc.restore();
}

function drawPin(doc: Doc, x: number, y: number, size: number, color = GOLD_SOFT) {
  doc.save();
  doc.translate(x, y).scale(size / 24);
  doc
    .path('M12 1.8c-4.1 0-7.4 3.2-7.4 7.2 0 5.4 7.4 13.2 7.4 13.2s7.4-7.8 7.4-13.2c0-4-3.3-7.2-7.4-7.2z')
    .lineWidth(1.1)
    .strokeColor(color, 1)
    .stroke();
  doc.circle(12, 8.2, 2.5).fillColor(color, 1).fill();
  doc
    .path('M7.6 14.2c.9-2 2.6-3 4.4-3s3.5 1 4.4 3c-1.2 1.6-2.7 2.8-4.4 4.5-1.7-1.7-3.2-2.9-4.4-4.5z')
    .fillColor(color, 0.85)
    .fill();
  doc.restore();
}

/** Fente de cordon (lanyard) : rectangle arrondi « percé » + liseré. */
function drawLanyardSlot(doc: Doc, y: number, ring: string, ringAlpha: number) {
  const w = 11;
  const h = 2.2;
  const x = CX - w / 2;
  rr(doc, x - 0.5, y - 0.5, w + 1, h + 1, (h + 1) / 2);
  strokePath(doc, ring, ringAlpha, 0.2);
  rr(doc, x, y, w, h, h / 2);
  fillPath(doc, PAGE_BG);
  // léger bord intérieur pour donner de la profondeur
  rr(doc, x + 0.1, y + 0.1, w - 0.2, h - 0.2, h / 2);
  strokePath(doc, '#000000', 0.18, 0.15);
}

/**
 * Cadre photo. `shape` : rectangle arrondi (portrait) ou rond. Le contenu est
 * rogné ; sans photo (ou photo illisible), un pictogramme est dessiné.
 */
function drawPhoto(
  doc: Doc,
  photo: Buffer | null,
  x: number,
  y: number,
  w: number,
  h: number,
  shape: 'rect' | 'circle',
  frame: number,
) {
  const path = (ix: number, iy: number, iw: number, ih: number, r: number) =>
    shape === 'circle' ? doc.circle(ix + iw / 2, iy + ih / 2, iw / 2) : rr(doc, ix, iy, iw, ih, r);

  softShadow(doc, x, y, w, h, shape === 'circle' ? w / 2 : 2.2, 0.8, 1.6, 0.3);
  path(x, y, w, h, 2.2);
  fillPath(doc, goldGradient(doc, x, y, w, h));

  const ix = x + frame;
  const iy = y + frame;
  const iw = w - frame * 2;
  const ih = h - frame * 2;
  path(ix, iy, iw, ih, 1.8).fill(
    cssLinear(doc, ix, iy, iw, ih, 160).stop(0, '#14618d').stop(0.55, '#0a3a56').stop(1, '#072c42'),
  );

  let drawn = false;
  if (photo) {
    doc.save();
    try {
      path(ix, iy, iw, ih, 1.8).clip();
      doc.image(photo, ix, iy, { cover: [iw, ih], align: 'center', valign: 'center' });
      drawn = true;
    } catch {
      // format d'image non pris en charge : on affichera le pictogramme
    } finally {
      doc.restore();
    }
  }
  if (!drawn) drawPin(doc, ix + (iw - 12) / 2, iy + (ih - 12) / 2, 12);
}

/** QR code dans un cadre or. */
function drawQr(doc: Doc, qr: Buffer, x: number, y: number, size: number) {
  const pad = 0.4;
  const innerPad = 0.9;
  softShadow(doc, x, y, size, size, 1.8, 0.6, 1.2, 0.3);
  rr(doc, x, y, size, size, 1.8);
  fillPath(doc, goldGradient(doc, x, y, size, size));
  const ix = x + pad;
  const iy = y + pad;
  const is = size - pad * 2;
  rr(doc, ix, iy, is, is, 1.4).fillColor('#ffffff', 1).fill();
  doc.image(qr, ix + innerPad, iy + innerPad, { width: is - innerPad * 2, height: is - innerPad * 2 });
}

interface Palette {
  label: string; // libellés des champs
  labelAlpha: number;
  value: string; // valeurs
  accent: string; // titres dorés / identifiant
  soft: string; // textes secondaires
  softAlpha: number;
}

/** Pastille de statut centrée sur `cx` (fond blanc sur gabarit clair, bleu nuit sur gabarit sombre). */
function drawStatusPill(doc: Doc, data: CardData, cx: number, y: number, onLight: boolean) {
  const label = statusLabel(data);
  const style: TextStyle = { font: BOLD, size: 5.4, color: onLight ? t.primaryDeep : '#ffffff', spacing: 0.6 };
  const textW = widthOf(doc, label, style);
  const dot = 1.3;
  const h = 3.2;
  const w = 1.9 + dot + 1.1 + textW + 2.4;
  const x = cx - w / 2;

  rr(doc, x, y, w, h, 10);
  fillPath(doc, onLight ? '#ffffff' : t.primaryDeep, onLight ? 1 : 0.95);
  rr(doc, x + 0.1, y + 0.1, w - 0.2, h - 0.2, 10);
  if (onLight) strokePath(doc, t.primary, 0.4, 0.2);
  else strokePath(doc, GOLD_SOFT, 0.9, 0.22);

  const dotX = x + 1.9 + dot / 2;
  const color = statusColor(data.status, onLight);
  doc.circle(dotX, y + h / 2, dot / 2 + 0.45);
  fillPath(doc, color, 0.28);
  doc.circle(dotX, y + h / 2, dot / 2);
  fillPath(doc, color, 1);

  drawText(doc, label, x + 1.9 + dot + 1.1, y + (h - lineHeight(style)) / 2 + 0.05, style);
}

/** Les quatre lignes d'informations (téléphone, localité, résidence, poste). Renvoie le bas. */
function drawInfoRows(doc: Doc, data: CardData, x: number, y: number, w: number, pal: Palette, rowGap = 1.5): number {
  const phone = parsePhone(data.phone);
  const tx = textsOf(data);
  const rows: Array<{ label: string; value: string }> = [
    { label: tx.phone, value: phone.text ? safe(phone.text) : '—' },
    // « Localité » = lieu d'origine du membre (ex. Lelouma)
    { label: tx.locality, value: safe(data.originDistrict) || '—' },
    { label: tx.residence, value: safe(`${data.city}, ${data.state}`) },
    {
      label: tx.position,
      value: safe(positionLabel(data.position, data.positionOther, data.locale ?? 'fr').toUpperCase()),
    },
  ];
  const labelStyle: TextStyle = { size: 4.5, color: pal.label, alpha: pal.labelAlpha, spacing: 0.45 };
  const valueStyle: TextStyle = { font: BOLD, size: 6.3, color: pal.value };
  const labelW = Math.max(...rows.map((r) => widthOf(doc, r.label, labelStyle))) + 1.8;
  const valueX = x + labelW;
  const rowH = lineHeight(valueStyle);
  for (const row of rows) {
    drawText(doc, row.label, x, y + (rowH - lineHeight(labelStyle)) / 2 + 0.1, labelStyle);
    // Valeur longue (ex. un poste saisi librement) : on réduit un peu la police avant de couper avec « … »
    const room = x + w - valueX;
    const style = shrinkToFit(doc, row.value, room, valueStyle, 5);
    drawText(doc, fitText(doc, row.value, room, style), valueX, y + (rowH - lineHeight(style)) / 2, style);
    y += rowH + rowGap;
  }
  return y - rowGap;
}

/** Prénom + NOM sur une ligne, réduits au besoin. Renvoie la hauteur utilisée. */
function drawFullName(doc: Doc, data: CardData, cx: number, y: number, w: number, color: string, size = 10.5): number {
  const fullName = safe(`${data.firstName} ${data.lastName.toUpperCase()}`);
  const style = shrinkToFit(doc, fullName, w, { font: BOLD, size, color, spacing: 0.2 }, 6.5);
  drawCentered(doc, fullName, cx, y, style);
  return lineHeight({ ...style, size });
}

/**
 * Bloc d'identité du pied de carte : à gauche N° identifiant, expiration et
 * texte de vérification ; à droite le QR code (ex-verso). Identifiant et
 * expiration sont côte à côte quand la largeur le permet, sinon empilés.
 */
function drawIdentityFooter(doc: Doc, data: CardData, left: number, bottom: number, qrSize: number, pal: Palette) {
  const tx = textsOf(data);
  const qrX = FACE_W - 3.4 - qrSize;
  const qrY = bottom - qrSize;
  drawQr(doc, data.qrPng, qrX, qrY, qrSize);

  const kStyle: TextStyle = { size: 4.3, color: pal.soft, alpha: pal.softAlpha, spacing: 0.9 };
  const idStyle: TextStyle = { font: BOLD, size: 7.2, color: pal.accent, spacing: 0.7 };
  const expStyle: TextStyle = { font: BOLD, size: 7.2, color: pal.value, spacing: 0.7 };
  const colW = qrX - 2.2 - left;
  const kH = lineHeight(kStyle) + 0.25;
  const vH = lineHeight(idStyle);
  const code = safe(data.memberCode);
  const exp = formatMonthYear(data.expiresAt);

  const idW = Math.max(widthOf(doc, tx.memberId, kStyle), widthOf(doc, code, idStyle));
  const expW = Math.max(widthOf(doc, tx.expiresEnd, kStyle), widthOf(doc, exp, expStyle));
  const sideBySide = idW + 3 + expW <= colW;

  // Hauteur du texte de vérification (2 à 3 lignes)
  const scan: TextStyle = { size: 4.1, color: pal.value, alpha: 0.85 };
  const scanBold: TextStyle = { font: BOLD, size: 4.1, color: pal.accent };
  setStyle(doc, scan);
  const fullScan = `${tx.scanPrefix}${tx.scanBold}${tx.scanSuffix}`;
  const scanH = doc.heightOfString(fullScan, { width: colW, lineGap: 0.2 });
  const blockH = (sideBySide ? kH + vH : kH * 2 + vH * 2 + 0.8) + 1.1 + scanH;

  let y = Math.max(qrY - 0.2, bottom - blockH);
  drawText(doc, tx.memberId, left, y, kStyle);
  drawText(doc, code, left, y + kH, idStyle);
  if (sideBySide) {
    const ex = left + idW + 3;
    drawText(doc, tx.expiresEnd, ex, y, kStyle);
    drawText(doc, exp, ex, y + kH, expStyle);
    y += kH + vH + 1.3;
  } else {
    y += kH + vH + 0.8;
    drawText(doc, tx.expiresEnd, left, y, kStyle);
    drawText(doc, exp, left, y + kH, expStyle);
    y += kH + vH + 1.1;
  }

  // Texte de vérification (ex-verso), mots-clés en gras
  setStyle(doc, scan);
  doc.fillColor(scan.color, scan.alpha ?? 1).text(tx.scanPrefix, left, y, { width: colW, continued: true, lineGap: 0.2 });
  setStyle(doc, scanBold);
  doc.fillColor(scanBold.color, 1).text(tx.scanBold, { continued: true, lineGap: 0.2 });
  setStyle(doc, scan);
  doc.fillColor(scan.color, scan.alpha ?? 1).text(tx.scanSuffix, { continued: false, lineGap: 0.2 });
  doc.fillOpacity(1);
}

// ---------------------------------------------------------------------------
// Recto unique : fond clair, grande forme océan et or dans l'angle (inspirée du
// badge PASTEF), photo cadrée, QR code et texte de vérification en pied
// ---------------------------------------------------------------------------

function drawMemberCard(doc: Doc, data: CardData) {
  const tx = textsOf(data);

  // Fond clair + voile bleuté vers le bas
  doc.rect(0, 0, FACE_W, FACE_H).fill(cssLinear(doc, 0, 0, FACE_W, FACE_H, 180).stop(0, '#FFFFFF').stop(1, '#E6EEF2'));
  // Filigrane : vagues très fines bleues et or derrière la photo
  drawGuilloche(doc, 15, 30, [t.primary, GOLD_SOFT], [0.1, 0.24], 22);

  // Grande forme ondulée dans l'angle haut-gauche (clin d'œil à PASTEF)
  doc.moveTo(0, 0).lineTo(26, 0).bezierCurveTo(16, 8, 6, 20, 0, 41).closePath();
  fillPath(doc, OCEAN_LIGHT, 0.32);
  doc.moveTo(0, 0).lineTo(21.5, 0).bezierCurveTo(12.5, 7, 4, 17, 0, 32).closePath();
  fillPath(doc, cssLinear(doc, 0, 0, 22, 32, 150).stop(0, t.primaryDeep).stop(1, t.primary));
  doc.moveTo(21.5, 0).bezierCurveTo(12.5, 7, 4, 17, 0, 32);
  strokePath(doc, t.accentGold, 1, 0.5);

  // Vagues du pied de carte
  fillWave(doc, 67.8, 1.3, 1.6, 0.6, 'below', OCEAN_LIGHT, 0.55);
  fillWave(doc, 69.6, 1.3, 1.6, 2.2, 'below', t.primary);
  fillWave(doc, 71.6, 1.1, 1.6, 3.6, 'below', cssLinear(doc, 0, 70, FACE_W, 15, 180).stop(0, t.primaryDark).stop(1, t.primaryDeep));
  strokeWave(doc, 69.6, 1.3, 1.6, 2.2, GOLD_SOFT, 0.95, 0.3);

  // Fente du cordon
  drawLanyardSlot(doc, 2.6, t.primary, 0.35);

  // En-tête : logo sur la forme bleue, pastille de marque, titre
  drawCircleImage(doc, 7.4, 11.2, 7.6, 0.35);
  const brand = safe(t.associationName);
  const brandStyle: TextStyle = { font: BOLD, size: 5.6, color: t.accentGoldLight, spacing: 1 };
  const pillW = widthOf(doc, brand, brandStyle) + 5;
  const pillH = 3.4;
  const hx = 15.6 + (FACE_W - 15.6 - 3.4 - pillW) / 2;
  rr(doc, hx, 7.4, pillW, pillH, 0.9);
  fillPath(doc, cssLinear(doc, hx, 7.4, pillW, pillH, 90).stop(0, t.primaryDark).stop(1, t.primary));
  drawCentered(doc, brand, hx + pillW / 2, 7.4 + (pillH - lineHeight(brandStyle)) / 2 + 0.1, brandStyle);
  const title = shrinkToFit(doc, tx.cardTitle, FACE_W - 15.6 - 3.4, { font: BOLD, size: 8.6, color: t.primaryDeep, spacing: 0.3 }, 5);
  drawCentered(doc, tx.cardTitle, hx + pillW / 2, 11.7, title);
  drawCentered(doc, `${tx.since} ${t.foundedYear}`, hx + pillW / 2, 14.55, {
    font: BOLD,
    size: 4.4,
    color: t.accentGoldDark,
    spacing: 1.6,
  });

  // Photo (cadre or + repères d'angle)
  const pw = 19.2;
  const ph = 23.6;
  const px0 = CX - pw / 2;
  const py0 = 18.2;
  drawPhoto(doc, data.photo, px0, py0, pw, ph, 'rect', 0.5);
  const b = 2.8;
  const off = 1.25;
  doc.lineWidth(0.3).lineCap('round').strokeColor(t.accentGoldDark, 1);
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const cx = sx < 0 ? px0 - off : px0 + pw + off;
    const cy = sy < 0 ? py0 - off : py0 + ph + off;
    doc.moveTo(cx, cy - sy * b).lineTo(cx, cy).lineTo(cx - sx * b, cy).stroke();
  }

  // Statut, mention, nom
  drawStatusPill(doc, data, CX, py0 + ph - 1.6, true);
  let y = py0 + ph + 3.1;
  y += drawCentered(doc, tx.memberBadge, CX, y, { font: BOLD, size: 4.8, color: t.accentGoldDark, spacing: 1.4 }) + 0.4;
  y += drawFullName(doc, data, CX, y, FACE_W - 8, t.primaryDeep) + 0.6;
  rr(doc, CX - 7, y, 14, 0.3, 0.15);
  fillPath(doc, goldGradient(doc, CX - 7, y, 14, 0.3));
  y += 1.8;

  drawInfoRows(doc, data, 4.8, y, FACE_W - 9.6, {
    label: t.primaryDark,
    labelAlpha: 0.7,
    value: t.primaryDeep,
    accent: t.accentGold,
    soft: '#fff',
    softAlpha: 0.7,
  });

  // Pied de carte sur les vagues sombres
  drawIdentityFooter(doc, data, 4.8, FACE_H - 3.4, 14, {
    label: '#fff',
    labelAlpha: 0.7,
    value: '#ffffff',
    accent: t.accentGoldLight,
    soft: '#ffffff',
    softAlpha: 0.7,
  });
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
 * Génère le PDF de la carte : une seule face, en portrait, au centre d'une page
 * avec une marge autour.
 */
export function renderMemberCardPdf(data: CardData): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [PAGE_WIDTH_MM * PT_PER_MM, PAGE_HEIGHT_MM * PT_PER_MM],
        margin: 0,
        info: { Title: `${textsOf(data).pdfTitle} ${safe(data.memberCode)}`, Author: safe(t.associationName) },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.scale(PT_PER_MM);

      // Fond de page
      doc.rect(0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM).fillColor(PAGE_BG, 1).fill();

      drawCard(doc, PAGE_MARGIN_MM, PAGE_MARGIN_MM, () => drawMemberCard(doc, data));

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
