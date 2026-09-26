"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderMemberCardHtml = renderMemberCardHtml;
const theme_1 = require("./theme");
function formatMonthYear(date) {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${mm}/${yy}`;
}
function statusLabel(status) {
    switch (status) {
        case 'ACTIVE':
            return 'ACTIF';
        case 'EXPIRING_SOON':
            return 'A RENOUVELER';
        case 'EXPIRED':
            return 'EXPIRE';
    }
}
function renderMemberCardHtml(data) {
    const t = theme_1.CARD_THEME;
    return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${theme_1.CARD_WIDTH_MM}mm;
    height: ${theme_1.CARD_HEIGHT_MM}mm;
  }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    position: relative;
    overflow: hidden;
    border-radius: 3mm;
    background: linear-gradient(135deg, ${t.primary} 0%, ${t.primaryDark} 100%);
  }

  .status-pill {
    position: absolute;
    top: 3.2mm; right: 4mm;
    background: rgba(255,255,255,0.16);
    border: 0.25mm solid rgba(255,255,255,0.55);
    color: #fff;
    font-size: 6.5px;
    font-weight: 700;
    letter-spacing: 0.3px;
    padding: 1mm 2.4mm;
    border-radius: 10mm;
  }
  .status-dot {
    display: inline-block;
    width: 1.3mm; height: 1.3mm;
    border-radius: 50%;
    background: #6EE7A8;
    margin-right: 1mm;
  }

  .brand {
    position: absolute;
    top: 3mm; left: 4mm;
    display: flex;
    align-items: center;
  }
  .brand-badge {
    width: 7mm; height: 7mm;
    border-radius: 50%;
    background: rgba(255,255,255,0.92);
    color: ${t.primaryDark};
    font-weight: 800;
    font-size: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 2mm;
  }
  .brand-name {
    color: #fff;
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: 0.4px;
  }
  .brand-sub {
    color: rgba(255,255,255,0.75);
    font-size: 5.3px;
    letter-spacing: 0.3px;
  }

  .photo {
    position: absolute;
    top: 12mm; left: 4mm;
    width: 20mm; height: 24mm;
    border-radius: 2mm;
    object-fit: cover;
    border: 0.4mm solid rgba(255,255,255,0.85);
    background: #cfd9e0;
  }

  .info {
    position: absolute;
    top: 12mm; left: 27mm; right: 4mm;
  }
  .info .label {
    color: rgba(255,255,255,0.7);
    font-size: 5.6px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    margin-bottom: 0.6mm;
  }
  .info .name {
    color: #fff;
    font-size: 10.5px;
    font-weight: 800;
    line-height: 1.15;
    margin-bottom: 1.6mm;
  }
  .info .row {
    display: flex;
    margin-bottom: 1.3mm;
  }
  .info .row .k {
    width: 17mm;
    color: rgba(255,255,255,0.65);
    font-size: 5.4px;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    padding-top: 0.3mm;
  }
  .info .row .v {
    color: #fff;
    font-size: 7px;
    font-weight: 600;
  }

  .footer {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 14mm;
    background: ${t.primaryDark};
    border-radius: 0 0 3mm 3mm;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4mm;
  }
  .footer .id-block .k {
    color: rgba(255,255,255,0.6);
    font-size: 5px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }
  .footer .id-block .v {
    color: #fff;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.6px;
  }
  .footer .exp-block {
    text-align: right;
    margin-right: 15mm;
  }
  .footer .exp-block .k {
    color: rgba(255,255,255,0.6);
    font-size: 5px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
  }
  .footer .exp-block .v {
    color: #fff;
    font-size: 8px;
    font-weight: 800;
  }

  .qr-wrap {
    position: absolute;
    right: 3mm; bottom: 3mm;
    width: 12mm; height: 12mm;
    background: #fff;
    border-radius: 1.4mm;
    padding: 0.8mm;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .qr-wrap img {
    width: 100%; height: 100%;
  }
</style>
</head>
<body>
  <div class="brand">
    <div class="brand-badge">LS</div>
    <div>
      <div class="brand-name">${t.associationName}</div>
      <div class="brand-sub">Carte de membre</div>
    </div>
  </div>

  <div class="status-pill"><span class="status-dot"></span>${statusLabel(data.status)}</div>

  <img class="photo" src="${data.photoUrl}" />

  <div class="info">
    <div class="label">Membre adherent</div>
    <div class="name">${data.firstName} ${data.lastName.toUpperCase()}</div>
    <div class="row"><div class="k">Ne(e) en</div><div class="v">${data.birthYear}</div></div>
    <div class="row"><div class="k">Origine</div><div class="v">${data.originDistrict}</div></div>
    <div class="row"><div class="k">Residence</div><div class="v">${data.city}, ${data.state}</div></div>
  </div>

  <div class="footer">
    <div class="id-block">
      <div class="k">N&deg; identifiant</div>
      <div class="v">${data.memberCode}</div>
    </div>
    <div class="exp-block">
      <div class="k">Expire fin</div>
      <div class="v">${formatMonthYear(data.expiresAt)}</div>
    </div>
  </div>

  <div class="qr-wrap"><img src="${data.qrDataUrl}" /></div>
</body>
</html>`;
}
//# sourceMappingURL=card-template.js.map