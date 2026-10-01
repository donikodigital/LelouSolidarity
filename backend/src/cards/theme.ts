//backend/src/cards/theme.ts
// v2.0 — palette propre a la carte (verre bleu, or, holographique). Elle ne
// depend plus de THEME (common/theme.ts), qui reste reserve aux e-mails :
// changer les couleurs de la carte ne touche donc plus les e-mails.
import { THEME } from '../common/theme';

// Dimensions exactes d'une carte bancaire (format CR80), utilisees pour le
// rendu HTML de chaque face (recto/verso) de la carte.
export const CARD_WIDTH_MM = 85.6;
export const CARD_HEIGHT_MM = 53.98;

// La carte est imprimee recto-verso, empilee sur une seule page PDF (le
// verso juste en dessous du recto, aligne), avec une marge autour pour que
// le rendu ne soit plus colle aux bords dans les lecteurs PDF.
export const PAGE_MARGIN_MM = 10;
export const CARD_GAP_MM = 8;
export const PAGE_WIDTH_MM = CARD_WIDTH_MM + PAGE_MARGIN_MM * 2;
export const PAGE_HEIGHT_MM = CARD_HEIGHT_MM * 2 + CARD_GAP_MM + PAGE_MARGIN_MM * 2;

export const CARD_THEME = {
  associationName: THEME.associationName,

  // Fond de la carte : verre givre en haut, bleu profond en bas (de haut en bas)
  glass: {
    top: '#F3F8FD',
    frost: '#D5E4F3',
    sky: '#5C97D6',
    royal: '#2C68B4',
    deep: '#1B4F9C',
    abyss: '#123F86',
  },

  // Textes
  text: {
    onFrost: '#123F86', // sur la zone claire (haut de carte)
    onFrostSoft: '#3C6FA8',
    label: '#CFE3F7', // etiquettes sur le bleu (NE(E) EN, ORIGINE...)
    onBlue: '#FFFFFF',
  },

  // Or des textes remplis (nom, annee, origine, residence) : degrade haut -> bas.
  // "solid" sert de couleur de secours si le degrade n'est pas rendu.
  gold: {
    hi: '#FFEBB0',
    lo: '#E9BE55',
    solid: '#F2CF6B',
  },

  halo: '#8FE8FF', // lueur autour du globe et du coin lumineux
  holo: ['#4FE3F5', '#7C6CFF', '#FF6FD0', '#FFD36B'], // puce holographique
  globe: ['#7FE3F5', '#6FA8FF', '#C58CFF', '#FFC97A'], // irisation du globe
  silver: ['#F7F9FB', '#D4DBE2', '#AEB8C3'], // puce a contacts
  edge: ['#FFFFFF', '#9FC0E4', '#FFFFFF'], // liseré de verre
  qrInk: '#0C2A5C',
};