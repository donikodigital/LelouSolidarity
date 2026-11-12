//backend/src/cards/theme.ts
import { THEME } from '../common/theme';

// Format badge « tour de cou » : carte CR80 (carte bancaire / badge PVC) en
// PORTRAIT, une seule face. Une fente de 11 x 2,2 mm en haut accueille le
// cordon (lanyard) ; elle est dessinée sur le PDF comme repère de perforation.
export const CARD_WIDTH_MM = 53.98;
export const CARD_HEIGHT_MM = 85.6;

// Marge blanche autour de la carte sur la page PDF (rendu confortable dans les
// lecteurs PDF, repères de coupe).
export const PAGE_MARGIN_MM = 10;
export const PAGE_WIDTH_MM = CARD_WIDTH_MM + PAGE_MARGIN_MM * 2;
export const PAGE_HEIGHT_MM = CARD_HEIGHT_MM + PAGE_MARGIN_MM * 2;

export const CARD_THEME = THEME;
