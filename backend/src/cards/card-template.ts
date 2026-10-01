//backend/src/cards/card-template.ts
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
  photoUrl: string;
  qrDataUrl: string; // data:image/png;base64,....
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
}

function formatMonthYear(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

// Les libelles sont inseres tels quels dans le HTML : les accents sont
// ecrits en entites HTML pour ne dependre d'aucun encodage.
function statusLabel(status: CardData['status']): string {
  switch (status) {
    case 'ACTIVE':
      return 'ACTIF';
    case 'EXPIRING_SOON':
      return '&Agrave; RENOUVELER';
    case 'EXPIRED':
      return 'EXPIR&Eacute;';
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

function esc(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Motif "guilloche" : un eventail de vagues fines (or et bleu clair) qui
 * s'entrecroisent, comme sur les billets et documents officiels.
 * Genere en SVG pur, donc net a n'importe quelle resolution d'impression.
 */
function guillocheSvg(): string {
  const W = 85.6;
  const H = 6;
  const lines = 18;
  const steps = 140;
  let paths = '';

  for (let i = 0; i < lines; i++) {
    const amp = 0.5 + i * 0.12;
    const phase = i * 0.27;
    let d = '';
    for (let s = 0; s <= steps; s++) {
      const x = (s / steps) * W;
      const y = H / 2 + amp * Math.sin((x / W) * Math.PI * 2 * 3.4 + phase);
      d += `${s === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)} `;
    }
    const stroke = i % 2 === 0 ? '#E3C677' : '#8FC3E3';
    const opacity = i % 2 === 0 ? 0.36 : 0.24;
    paths += `<path d="${d}" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="0.11"/>`;
  }

  return `<svg class="guilloche" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
}

const FINGERPRINT_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/></svg>`;

// Pictogramme affiche uniquement quand le membre n'a pas de photo.
const PIN_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 1.8c-4.1 0-7.4 3.2-7.4 7.2 0 5.4 7.4 13.2 7.4 13.2s7.4-7.8 7.4-13.2c0-4-3.3-7.2-7.4-7.2z" fill="none" stroke="#E3C677" stroke-width="1.1"/><circle cx="12" cy="8.2" r="2.5" fill="#E3C677"/><path d="M7.6 14.2c.9-2 2.6-3 4.4-3s3.5 1 4.4 3c-1.2 1.6-2.7 2.8-4.4 4.5-1.7-1.7-3.2-2.9-4.4-4.5z" fill="#E3C677" fill-opacity="0.85"/></svg>`;

/**
 * Genere le document HTML complet de la carte de membre : recto et verso,
 * empiles verticalement et alignes sur une seule page PDF (le verso
 * directement sous le recto), avec une marge de page pour eviter que le
 * rendu ne soit colle aux bords dans les lecteurs PDF. Concu pour etre
 * rendu par Puppeteer et exporte via page.pdf({ width: PAGE_WIDTH_MM,
 * height: PAGE_HEIGHT_MM }).
 *
 * Design : metal bleu nuit brosse, lisere or, motif guilloche, puce
 * d'empreinte, cadre photo vitre, pastille de statut coloree.
 */
export function renderMemberCardHtml(data: CardData): string {
  const t = CARD_THEME;
  const hasPhoto = Boolean(data.photoUrl && data.photoUrl.trim());
  const expiry = formatMonthYear(data.expiresAt);
  const gold = `linear-gradient(135deg, ${t.accentGoldLight} 0%, ${t.accentGold} 30%, ${t.accentGoldDark} 58%, ${t.accentGoldLight} 82%, ${t.accentGold} 100%)`;

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${PAGE_WIDTH_MM}mm;
    height: ${PAGE_HEIGHT_MM}mm;
  }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    background: #e9eef2;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: ${PAGE_MARGIN_MM}mm 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ---------- Carte : liseré or + face metal bleu nuit ---------- */
  .card {
    position: relative;
    width: ${CARD_WIDTH_MM}mm;
    height: ${CARD_HEIGHT_MM}mm;
    border-radius: 3.2mm;
    padding: 0.55mm;
    background: ${gold};
    box-shadow: 0 1mm 3mm rgba(0,0,0,0.22);
  }
  .card + .card { margin-top: ${CARD_GAP_MM}mm; }

  .face {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 2.7mm;
    background:
      radial-gradient(120% 90% at 85% 0%, ${t.primary} 0%, rgba(14,85,129,0) 60%),
      linear-gradient(145deg, #0d4a70 0%, ${t.primaryDark} 48%, ${t.primaryDeep} 100%);
  }
  /* Reflet diagonal + grain de metal brosse */
  .face::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(112deg, rgba(255,255,255,0) 28%, rgba(255,255,255,0.11) 44%, rgba(255,255,255,0.03) 54%, rgba(255,255,255,0) 66%),
      repeating-linear-gradient(90deg, rgba(255,255,255,0.028) 0, rgba(255,255,255,0.028) 0.15mm, rgba(0,0,0,0.03) 0.15mm, rgba(0,0,0,0.03) 0.4mm);
  }

  .guilloche {
    position: absolute;
    left: 0; bottom: 11.5mm;
    width: 100%; height: 6mm;
  }

  /* ---------- En-tete ---------- */
  .brand {
    position: absolute;
    top: 3.2mm; left: 4mm;
    display: flex;
    align-items: center;
  }
  .brand-logo {
    width: 9.5mm; height: 9.5mm;
    border-radius: 50%;
    box-shadow: 0 0 0 0.3mm ${t.accentGold}, 0 0.6mm 1.4mm rgba(0,0,0,0.35);
    margin-right: 2.4mm;
  }
  .brand-name {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.1px;
    color: ${t.accentGoldLight};
    background: ${gold};
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .brand-sub {
    margin-top: 0.5mm;
    color: rgba(255,255,255,0.72);
    font-size: 5px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .chip {
    position: absolute;
    top: 4.2mm; right: 26mm;
    width: 7.2mm; height: 7.2mm;
    border-radius: 50%;
    color: ${t.accentGold};
    background: rgba(255,255,255,0.07);
    border: 0.25mm solid rgba(227,198,119,0.65);
    padding: 1.3mm;
  }
  .chip svg { width: 100%; height: 100%; display: block; }

  .status-pill {
    position: absolute;
    top: 4.6mm; right: 4mm;
    display: flex;
    align-items: center;
    background: rgba(255,255,255,0.12);
    border: 0.25mm solid rgba(255,255,255,0.5);
    color: #fff;
    font-size: 6.2px;
    font-weight: 700;
    letter-spacing: 0.6px;
    padding: 0.9mm 2.6mm 0.9mm 2mm;
    border-radius: 10mm;
  }
  .status-dot {
    width: 1.5mm; height: 1.5mm;
    border-radius: 50%;
    margin-right: 1.2mm;
    box-shadow: 0 0 1mm currentColor;
  }

  /* ---------- Photo (cadre vitre) ---------- */
  .photo-frame {
    position: absolute;
    top: 15.2mm; left: 4mm;
    width: 20mm; height: 24.5mm;
    border-radius: 2.2mm;
    padding: 0.5mm;
    background: ${gold};
    box-shadow: 0 0.8mm 2mm rgba(0,0,0,0.35);
  }
  .photo-inner {
    width: 100%; height: 100%;
    border-radius: 1.8mm;
    overflow: hidden;
    background: linear-gradient(160deg, #14618d 0%, #0a3a56 55%, #072c42 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .photo-inner img.photo {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
  }
  .photo-inner svg { width: 13mm; height: 13mm; }

  /* ---------- Informations ---------- */
  .info {
    position: absolute;
    top: 15mm; left: 28.5mm; right: 4mm;
  }
  .info .label {
    color: ${t.accentGold};
    font-size: 5.4px;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    margin-bottom: 0.7mm;
  }
  .info .name {
    color: #fff;
    font-size: 11.5px;
    font-weight: 800;
    line-height: 1.12;
    letter-spacing: 0.2px;
    margin-bottom: 0.9mm;
  }
  .info .rule {
    width: 14mm;
    height: 0.3mm;
    background: ${gold};
    margin-bottom: 1.9mm;
  }
  .info .row {
    display: flex;
    margin-bottom: 1.35mm;
  }
  .info .row .k {
    width: 15mm;
    color: rgba(255,255,255,0.62);
    font-size: 5.1px;
    letter-spacing: 0.7px;
    text-transform: uppercase;
    padding-top: 0.35mm;
  }
  .info .row .v {
    color: #fff;
    font-size: 7px;
    font-weight: 600;
  }

  /* ---------- Pied de carte ---------- */
  .footer {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 11.5mm;
    background: linear-gradient(180deg, rgba(6,38,58,0.55), rgba(6,38,58,0.9));
    border-top: 0.25mm solid rgba(227,198,119,0.6);
    display: flex;
    align-items: center;
    padding: 0 4mm;
  }
  .footer .k {
    color: rgba(255,255,255,0.58);
    font-size: 4.8px;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 0.4mm;
  }
  .footer .v {
    color: ${t.accentGoldLight};
    font-size: 8.2px;
    font-weight: 800;
    letter-spacing: 1px;
  }
  .footer .exp-block { margin-left: 9mm; }
  .footer .exp-block .v { color: #fff; }

  .qr-wrap {
    position: absolute;
    right: 3.6mm; bottom: 3mm;
    width: 14.5mm; height: 14.5mm;
    border-radius: 1.8mm;
    padding: 0.4mm;
    background: ${gold};
    box-shadow: 0 0.6mm 1.6mm rgba(0,0,0,0.4);
  }
  .qr-wrap .qr-inner {
    width: 100%; height: 100%;
    background: #fff;
    border-radius: 1.4mm;
    padding: 0.9mm;
  }
  .qr-wrap img { width: 100%; height: 100%; display: block; }

  /* ---------- Verso ---------- */
  .verso .guilloche { bottom: 9mm; }
  .verso .inner-frame {
    position: absolute;
    inset: 1.6mm;
    border: 0.2mm solid rgba(227,198,119,0.45);
    border-radius: 2mm;
  }
  .verso .left {
    position: absolute;
    left: 5mm; top: 0; bottom: 9mm;
    width: 31mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .verso .big-logo {
    width: 24mm; height: 24mm;
    border-radius: 50%;
    box-shadow: 0 0 0 0.4mm ${t.accentGold}, 0 1mm 2.4mm rgba(0,0,0,0.4);
  }
  .verso .caption {
    margin-top: 3mm;
    text-align: center;
    color: ${t.accentGoldLight};
    font-size: 5.4px;
    font-weight: 700;
    letter-spacing: 1.6px;
    text-transform: uppercase;
  }
  .verso .divider {
    position: absolute;
    left: 40mm; top: 7mm; bottom: 14mm;
    width: 0.25mm;
    background: linear-gradient(180deg, rgba(227,198,119,0), rgba(227,198,119,0.8), rgba(227,198,119,0));
  }
  .verso .right {
    position: absolute;
    left: 43mm; right: 5mm; top: 0; bottom: 9mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .verso .qr-wrap {
    position: static;
    width: 27mm; height: 27mm;
    border-radius: 2.4mm;
    padding: 0.5mm;
  }
  .verso .qr-wrap .qr-inner { border-radius: 1.9mm; padding: 1.6mm; }
  .verso .verify-text {
    margin-top: 2.4mm;
    color: rgba(255,255,255,0.88);
    font-size: 5.4px;
    letter-spacing: 0.2px;
    text-align: center;
    line-height: 1.45;
  }
  .verso .verify-text b { color: ${t.accentGoldLight}; font-weight: 700; }
  .verso .verso-footer {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 9mm;
    background: linear-gradient(180deg, rgba(6,38,58,0.55), rgba(6,38,58,0.9));
    border-top: 0.25mm solid rgba(227,198,119,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .verso .verso-footer .v {
    color: #fff;
    font-size: 6.2px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .verso .verso-footer .v span { color: ${t.accentGoldLight}; }
</style>
</head>
<body>

  <!-- RECTO -->
  <div class="card">
    <div class="face">
      ${guillocheSvg()}

      <div class="brand">
        <img class="brand-logo" src="${LOGO_DATA_URL}" />
        <div>
          <div class="brand-name">${esc(t.associationName)}</div>
          <div class="brand-sub">Carte de membre</div>
        </div>
      </div>

      <div class="chip">${FINGERPRINT_SVG}</div>

      <div class="status-pill">
        <span class="status-dot" style="background:${statusColor(data.status)};color:${statusColor(data.status)}"></span>${statusLabel(data.status)}
      </div>

      <div class="photo-frame">
        <div class="photo-inner">
          ${hasPhoto ? `<img class="photo" src="${esc(data.photoUrl)}" />` : PIN_SVG}
        </div>
      </div>

      <div class="info">
        <div class="label">Membre adh&eacute;rent</div>
        <div class="name">${esc(data.firstName)} ${esc(data.lastName.toUpperCase())}</div>
        <div class="rule"></div>
        <div class="row"><div class="k">N&eacute;(e) en</div><div class="v">${esc(data.birthYear)}</div></div>
        <div class="row"><div class="k">Origine</div><div class="v">${esc(data.originDistrict)}</div></div>
        <div class="row"><div class="k">R&eacute;sidence</div><div class="v">${esc(data.city)}, ${esc(data.state)}</div></div>
      </div>

      <div class="footer">
        <div class="id-block">
          <div class="k">N&deg; identifiant</div>
          <div class="v">${esc(data.memberCode)}</div>
        </div>
        <div class="exp-block">
          <div class="k">Expire fin</div>
          <div class="v">${expiry}</div>
        </div>
      </div>

      <div class="qr-wrap"><div class="qr-inner"><img src="${data.qrDataUrl}" /></div></div>
    </div>
  </div>

  <!-- VERSO -->
  <div class="card verso">
    <div class="face">
      ${guillocheSvg()}
      <div class="inner-frame"></div>

      <div class="left">
        <img class="big-logo" src="${LOGO_DATA_URL}" />
        <div class="caption">Carte de membre</div>
      </div>

      <div class="divider"></div>

      <div class="right">
        <div class="qr-wrap"><div class="qr-inner"><img src="${data.qrDataUrl}" /></div></div>
        <div class="verify-text">
          Scannez ce code pour <b>v&eacute;rifier l'authenticit&eacute;</b><br/>de cette carte de membre.
        </div>
      </div>

      <div class="verso-footer">
        <div class="v">${esc(data.memberCode)} &middot; <span>Expire fin ${expiry}</span></div>
      </div>
    </div>
  </div>

</body>
</html>`;
}