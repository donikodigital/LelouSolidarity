//backend/src/cards/card-template.ts
// v2.0 — carte "verre bleu" : chaque face est un dessin SVG vectoriel
// (globe holographique, reflets, puce LS, QR). Textes remplis (nom, annee,
// origine, residence) en or ; bloc d'infos remonte pour garder une marge
// confortable en bas de carte. Valeurs saisies par les membres echappees.
import {
  CARD_GAP_MM,
  CARD_HEIGHT_MM,
  CARD_THEME,
  CARD_WIDTH_MM,
  PAGE_HEIGHT_MM,
  PAGE_MARGIN_MM,
  PAGE_WIDTH_MM,
} from './theme';
import { LOGO_DATA_URI } from './logo';

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
  photoUrl: string;
  qrDataUrl: string; // data:image/png;base64,....
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
}

const T = CARD_THEME;

// Repere de dessin : 340 x 214 unites (meme rapport que la carte CR80)
const W = 340;
const H = 214;

// Recadrage automatique de la photo sur le visage via Cloudinary (c_fill,g_face).
// Passer a false si la photo n'apparait plus (transformations restreintes).
const FACE_CROP = true;

function esc(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMonthYear(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

function faceCropUrl(url: string): string {
  const marker = '/upload/';
  const index = url.indexOf(marker);
  if (!FACE_CROP || !url.includes('res.cloudinary.com') || index === -1) return url;
  const cut = index + marker.length;
  return `${url.slice(0, cut)}c_fill,g_face,w_372,h_444/${url.slice(cut)}`;
}

interface TxtOptions {
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
  spacing?: number;
  maxWidth?: number;
}

/**
 * Texte SVG. Si le texte risque de depasser maxWidth (noms longs, police de
 * secours plus large), il est comprime a cette largeur au lieu de deborder.
 */
function txt(
  x: number,
  y: number,
  content: string,
  size: number,
  fill: string,
  o: TxtOptions = {},
): string {
  const attrs = [`x="${x}"`, `y="${y}"`, `font-size="${size}"`, `fill="${fill}"`];
  if (o.weight) attrs.push(`font-weight="${o.weight}"`);
  if (o.anchor) attrs.push(`text-anchor="${o.anchor}"`);
  if (o.spacing) attrs.push(`letter-spacing="${o.spacing}"`);
  if (o.maxWidth && content.length * size * 0.62 > o.maxWidth) {
    attrs.push(`textLength="${o.maxWidth}" lengthAdjust="spacingAndGlyphs"`);
  }
  return `<text ${attrs.join(' ')}>${esc(content)}</text>`;
}

function spark(x: number, y: number, s: number, opacity = 0.95): string {
  return `<path d="M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s}Z" fill="#fff" opacity="${opacity}"/>`;
}

function nfc(x: number, y: number, color: string): string {
  let s = '';
  for (let k = 1; k <= 3; k++) {
    s += `<path d="M${x + k * 3} ${y - k * 3.2} Q${x + k * 3 + k * 2.2} ${y} ${x + k * 3} ${y + k * 3.2}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>`;
  }
  return s;
}

function globeGrid(R: number): string {
  let s = '';
  for (const k of [0.32, 0.64]) {
    s += `<ellipse cx="0" cy="0" rx="${(R * k).toFixed(1)}" ry="${R}" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="0.7"/>`;
  }
  s += `<line x1="0" y1="${-R}" x2="0" y2="${R}" stroke="#fff" stroke-opacity="0.5" stroke-width="0.7"/>`;
  for (const f of [-0.6, -0.3, 0, 0.3, 0.6]) {
    const dy = R * f;
    s += `<ellipse cx="0" cy="${dy.toFixed(1)}" rx="${Math.sqrt(R * R - dy * dy).toFixed(1)}" ry="${(R * 0.09).toFixed(1)}" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="0.7"/>`;
  }
  return s;
}

// Continents stylises (en points), dessines pour un globe de rayon 44
const LAND_PATH =
  'M-12 -10 L-6 -14 L2 -13 L10 -9 L16 -4 L22 -2 L18 4 L14 10 L10 20 L5 28 L-1 27 L-5 18 L-6 10 L-12 5 L-18 0 L-16 -6Z ' +
  'M-12 -22 L-6 -28 L4 -30 L12 -26 L10 -20 L16 -18 L12 -14 L2 -14 L-6 -16 L-14 -17Z ' +
  'M18 -26 L30 -28 L40 -18 L38 -8 L30 -4 L24 -8 L20 -14Z ' +
  'M-36 4 L-28 -2 L-22 4 L-24 16 L-30 26 L-34 18Z ' +
  'M-40 -16 L-30 -26 L-20 -22 L-22 -10 L-30 -6 L-38 -8Z';

function globe(uid: string, cx: number, cy: number, R: number): string {
  const k = (R / 44).toFixed(3);
  const gx = (-0.42 * R).toFixed(1);
  const gy = (-0.58 * R).toFixed(1);
  let s = `<circle cx="${cx}" cy="${cy}" r="${R + 18}" fill="url(#gg${uid})"/>`;
  s += `<g transform="translate(${cx} ${cy})">`;
  s += `<circle r="${R}" fill="url(#gb${uid})"/><circle r="${R}" fill="url(#gr${uid})" opacity="0.3"/>`;
  s += `<g clip-path="url(#gc${uid})"><g mask="url(#mk${uid})"><g transform="scale(${k})"><path d="${LAND_PATH}" fill="url(#gr${uid})"/></g></g>${globeGrid(R)}`;
  s += `<ellipse cx="${gx}" cy="${gy}" rx="${(0.62 * R).toFixed(1)}" ry="${(0.22 * R).toFixed(1)}" transform="rotate(-35 ${gx} ${gy})" fill="url(#sp${uid})"/></g>`;
  s += `<circle r="${R}" fill="none" stroke="url(#rm${uid})" stroke-width="1.8"/></g>`;
  s += spark(cx - R * 0.72, cy - R * 0.62, 7) + spark(cx + R * 0.66, cy + R * 0.55, 5);
  return s;
}

// Petite puce holographique "LS" (securite visuelle de la carte)
function holoTile(uid: string, x: number, y: number, w: number, h: number, fs: number): string {
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="url(#ho${uid})" stroke="#fff" stroke-opacity="0.8"/>` +
    `<path d="M${x} ${y + h * 0.62} L${x + w * 0.7} ${y} L${x + w} ${y} L${x + w} ${y + h * 0.15} L${x + w * 0.3} ${y + h} L${x} ${y + h}Z" fill="#fff" opacity="0.3"/>` +
    `<text x="${x + w / 2 + 0.8}" y="${y + h * 0.68 + 0.8}" font-size="${fs}" font-weight="600" fill="${T.glass.deep}" opacity="0.45" text-anchor="middle">LS</text>` +
    `<text x="${x + w / 2}" y="${y + h * 0.68}" font-size="${fs}" font-weight="600" fill="#fff" text-anchor="middle">LS</text>` +
    spark(x + w - 5, y + 5, 5)
  );
}

// Logo de l'association (rond), a la place de la grande puce LS
function logoBadge(uid: string, cx: number, cy: number, r: number): string {
  if (!LOGO_DATA_URI) return holoTile(uid, cx - r, cy - r * 0.8, r * 2, r * 1.6, 16);
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r + 1.2}" fill="#fff" fill-opacity="0.9"/>` +
    `<clipPath id="lc${uid}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>` +
    `<image href="${LOGO_DATA_URI}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" clip-path="url(#lc${uid})"/>`
  );
}

function defs(uid: string, R: number): string {
  const g = T.glass;
  return (
    '<defs>' +
    `<linearGradient id="gl${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g.top}"/><stop offset="0.2" stop-color="${g.frost}"/><stop offset="0.4" stop-color="${g.sky}"/><stop offset="0.58" stop-color="${g.royal}"/><stop offset="0.78" stop-color="${g.deep}"/><stop offset="1" stop-color="${g.abyss}"/></linearGradient>` +
    `<linearGradient id="ed${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.edge[0]}"/><stop offset="0.5" stop-color="${T.edge[1]}"/><stop offset="1" stop-color="${T.edge[2]}"/></linearGradient>` +
    `<linearGradient id="th${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="bd${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<radialGradient id="bl${uid}" cx="0.78" cy="1" r="0.75"><stop offset="0" stop-color="${T.halo}" stop-opacity="0.55"/><stop offset="1" stop-color="${T.halo}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="ho${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.holo[0]}"/><stop offset="0.35" stop-color="${T.holo[1]}"/><stop offset="0.65" stop-color="${T.holo[2]}"/><stop offset="1" stop-color="${T.holo[3]}"/></linearGradient>` +
    `<linearGradient id="gr${uid}" gradientUnits="userSpaceOnUse" x1="-44" y1="-30" x2="44" y2="40"><stop offset="0" stop-color="${T.globe[0]}"/><stop offset="0.35" stop-color="${T.globe[1]}"/><stop offset="0.65" stop-color="${T.globe[2]}"/><stop offset="1" stop-color="${T.globe[3]}"/></linearGradient>` +
    `<radialGradient id="gb${uid}" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#fff" stop-opacity="0.6"/><stop offset="1" stop-color="#7DB4F0" stop-opacity="0.25"/></radialGradient>` +
    `<radialGradient id="gg${uid}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${T.halo}" stop-opacity="0"/><stop offset="0.72" stop-color="${T.halo}" stop-opacity="0"/><stop offset="0.8" stop-color="${T.halo}" stop-opacity="0.6"/><stop offset="1" stop-color="${T.halo}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="rm${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="0.4" stop-color="${T.globe[0]}"/><stop offset="0.7" stop-color="${T.globe[2]}"/><stop offset="1" stop-color="#fff"/></linearGradient>` +
    `<linearGradient id="sp${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.65"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="sv${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.silver[0]}"/><stop offset="0.5" stop-color="${T.silver[1]}"/><stop offset="1" stop-color="${T.silver[2]}"/></linearGradient>` +
    `<linearGradient id="gt${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.gold.hi}"/><stop offset="1" stop-color="${T.gold.lo}"/></linearGradient>` +
    `<pattern id="dt${uid}" width="3.8" height="3.8" patternUnits="userSpaceOnUse"><circle cx="1.9" cy="1.9" r="1.15" fill="#fff"/></pattern>` +
    `<mask id="mk${uid}" maskUnits="userSpaceOnUse" x="-70" y="-70" width="140" height="140"><rect x="-70" y="-70" width="140" height="140" fill="url(#dt${uid})"/></mask>` +
    `<clipPath id="gc${uid}"><circle r="${R}"/></clipPath>` +
    `<clipPath id="pc${uid}"><rect x="24" y="54" width="62" height="74" rx="8"/></clipPath>` +
    `<clipPath id="c${uid}"><rect width="${W}" height="${H}" rx="14"/></clipPath>` +
    '</defs>'
  );
}

// Fond de verre, bandes de lumiere, halo : commun aux deux faces
function glassBackground(uid: string): string {
  return (
    `<rect width="${W}" height="${H}" fill="url(#gl${uid})"/><rect width="${W}" height="${H}" fill="url(#bl${uid})"/>` +
    `<path d="M-30 0 L130 0 L50 214 L-50 214Z" fill="url(#bd${uid})"/>` +
    `<path d="M142 0 L166 0 L86 214 L62 214Z" fill="url(#bd${uid})" opacity="0.7"/>` +
    `<path d="M206 0 L214 0 L134 214 L126 214Z" fill="url(#bd${uid})" opacity="0.6"/>`
  );
}

function glassEdges(uid: string): string {
  return (
    `<path d="M16 1.6 H324" stroke="url(#th${uid})" stroke-width="1.6" fill="none"/>` +
    `<rect x="3" y="3" width="334" height="208" rx="11" fill="none" stroke="#fff" stroke-opacity="0.22"/>`
  );
}

function rectoContent(uid: string, d: CardData): string {
  const gold = `url(#gt${uid}) ${T.gold.solid}`;
  const label = T.text.label;
  const fullName = `${d.firstName} ${d.lastName.toUpperCase()}`;
  const residence = `${d.city}, ${d.state}`;
  const exp = `Exp. ${formatMonthYear(d.expiresAt)}`;

  let s = logoBadge(uid, 38, 32, 18) + holoTile(uid, 292, 14, 30, 26, 12);
  s += txt(64, 36, T.associationName, 11, T.text.onFrost, { weight: 600, spacing: 0.5, maxWidth: 135 });
  s += nfc(286, 72, T.text.onFrostSoft);
  s += globe(uid, 208, 96, 60);

  // Cadre photo en verre : silhouette de secours, photo recadree, contour et reflet
  s +=
    `<rect x="24" y="54" width="62" height="74" rx="8" fill="#fff" fill-opacity="0.22"/>` +
    `<circle cx="55" cy="84" r="11" fill="#fff" fill-opacity="0.85"/><path d="M33 126 Q33 104 55 104 Q77 104 77 126Z" fill="#fff" fill-opacity="0.85"/>` +
    `<image href="${esc(faceCropUrl(d.photoUrl))}" x="24" y="54" width="62" height="74" preserveAspectRatio="xMidYMid slice" clip-path="url(#pc${uid})"/>` +
    `<rect x="24" y="54" width="62" height="74" rx="8" fill="none" stroke="#fff" stroke-opacity="0.9" stroke-width="1.4"/>` +
    `<path d="M30 56.5 H80" stroke="#fff" stroke-width="1.5" stroke-opacity="0.9" stroke-linecap="round"/>`;

  // Puce a contacts (decor)
  s +=
    `<rect x="96" y="102" width="32" height="26" rx="5" fill="url(#sv${uid})" stroke="#8E9BA8" stroke-width="1"/>` +
    `<path d="M96 115 H128 M112 102 V128 M96 108 H104 V122 H96 M128 108 H120 V122 H128" fill="none" stroke="#8E9BA8" stroke-width="0.8"/>` +
    `<path d="M99 104.5 H125" stroke="#fff" stroke-width="1.2" opacity="0.9" stroke-linecap="round"/>`;

  // Bloc d'infos : remonte pour garder ~17 unites de marge sous la derniere ligne
  s += txt(24, 141, 'MEMBRE ADHERENT', 11, label, { spacing: 0.7 });
  s += txt(24, 157, fullName, 16, gold, { weight: 600, maxWidth: 150 });
  s += txt(24, 171, 'NE(E) EN', 11, label, { spacing: 0.5 });
  s += txt(104, 171, String(d.birthYear), 12, gold, { weight: 600 });
  s += txt(24, 184, 'ORIGINE', 11, label, { spacing: 0.5 });
  s += txt(104, 184, d.originDistrict, 12, gold, { weight: 600, maxWidth: 156 });
  s += txt(24, 197, 'RESIDENCE', 11, label, { spacing: 0.5 });
  s += txt(104, 197, residence, 12, gold, { weight: 600, maxWidth: 156 });

  // QR de verification + identifiant et expiration
  s +=
    `<rect x="266" y="124" width="44" height="44" rx="6" fill="#fff"/>` +
    `<image href="${esc(d.qrDataUrl)}" x="270" y="128" width="36" height="36" style="image-rendering:pixelated"/>` +
    `<path d="M272 126.5 H302" stroke="${T.text.label}" stroke-width="1.2" stroke-linecap="round"/>`;
  s += txt(288, 182, d.memberCode, 10, T.text.onBlue, { weight: 600, anchor: 'middle', maxWidth: 84 });
  s += txt(288, 195, exp, 10, label, { anchor: 'middle', maxWidth: 84 });

  s += spark(318, 70, 5, 0.8) + spark(150, 158, 4, 0.7);
  return s;
}

function versoContent(uid: string, d: CardData): string {
  let s = logoBadge(uid, 38, 32, 18);
  s += txt(64, 30, T.associationName, 11, T.text.onFrost, { weight: 600, spacing: 0.5, maxWidth: 135 });
  s += txt(64, 44, 'Verification de la carte', 10.5, T.text.onFrostSoft, { maxWidth: 150 });
  s += nfc(296, 34, T.text.onFrostSoft);
  s += `<g opacity="0.7">${globe(uid, 296, 146, 46)}</g>`;
  s +=
    `<rect x="123" y="58" width="94" height="94" rx="10" fill="#fff" stroke="#fff" stroke-opacity="0.8"/>` +
    `<image href="${esc(d.qrDataUrl)}" x="133" y="68" width="74" height="74" style="image-rendering:pixelated"/>` +
    `<path d="M132 60.5 H190" stroke="${T.text.label}" stroke-width="1.4" stroke-linecap="round"/>`;
  s += txt(
    170,
    197,
    `${d.memberCode} \u00b7 Expire fin ${formatMonthYear(d.expiresAt)}`,
    11.5,
    T.text.onBlue,
    { weight: 600, anchor: 'middle', maxWidth: 240 },
  );
  s += spark(60, 120, 5, 0.8);
  return s;
}

function renderFace(face: 'recto' | 'verso', d: CardData): string {
  const uid = face === 'recto' ? 'f' : 'b';
  const R = face === 'recto' ? 60 : 46;
  const content = face === 'recto' ? rectoContent(uid, d) : versoContent(uid, d);
  return (
    `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">` +
    defs(uid, R) +
    `<g clip-path="url(#c${uid})">` +
    glassBackground(uid) +
    content +
    glassEdges(uid) +
    '</g>' +
    `<rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="13.5" fill="none" stroke="url(#ed${uid})" stroke-width="1.5"/>` +
    '</svg>'
  );
}

/**
 * Genere le document HTML complet de la carte de membre : recto et verso,
 * empiles verticalement et alignes sur une seule page PDF (le verso
 * directement sous le recto), avec une marge de page pour eviter que le
 * rendu ne soit colle aux bords dans les lecteurs PDF. Concu pour etre
 * rendu par Puppeteer et exporte via page.pdf({ width: PAGE_WIDTH_MM,
 * height: PAGE_HEIGHT_MM }).
 */
export function renderMemberCardHtml(data: CardData): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${PAGE_WIDTH_MM}mm;
    height: ${PAGE_HEIGHT_MM}mm;
  }
  body {
    font-family: 'Montserrat', 'Helvetica Neue', Arial, sans-serif;
    background: #eef2f5;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: ${PAGE_MARGIN_MM}mm 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .card {
    width: ${CARD_WIDTH_MM}mm;
    height: ${CARD_HEIGHT_MM}mm;
    border-radius: 3.5mm;
    overflow: hidden;
    box-shadow: 0 1mm 3mm rgba(0, 0, 0, 0.18);
  }
  .card + .card { margin-top: ${CARD_GAP_MM}mm; }
  .card svg { display: block; width: 100%; height: 100%; }
</style>
</head>
<body>
  <div class="card">${renderFace('recto', data)}</div>
  <div class="card">${renderFace('verso', data)}</div>
</body>
</html>`;
}