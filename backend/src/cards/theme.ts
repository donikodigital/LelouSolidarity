//backend/src/cards/theme.ts
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

export const CARD_THEME = THEME;