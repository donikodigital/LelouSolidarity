//web/components/layout/KeyboardAware.tsx
// v2.0 — la zone réellement visible (au-dessus du clavier) est publiée dans des variables CSS
// (--vvh, --vv-top) : les modales et feuilles s'y calent (classe .kb-viewport) sur TOUS les
// navigateurs, y compris ceux qui laissent le clavier recouvrir la page (Safari iPhone, certains
// navigateurs Android). Le champ actif n'est plus déplacé quand il est déjà bien visible.
// v1.0 — champ actif amené au centre + attribut data-keyboard="open" sur <html>.
'use client';

import { useEffect } from 'react';

/** Champs qui ouvrent le clavier du téléphone. */
function isTextField(el: Element | null): el is HTMLElement {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
  if (el instanceof HTMLInputElement) {
    return !['checkbox', 'radio', 'file', 'button', 'submit', 'range', 'color'].includes(el.type);
  }
  return el instanceof HTMLElement && el.isContentEditable;
}

/** Hauteur minimale de clavier (en px) à partir de laquelle on considère qu'il est ouvert. */
const KEYBOARD_MIN_HEIGHT = 140;
/** Marges (en px) de la zone où un champ est jugé « bien visible » : libellé au-dessus, bouton en dessous. */
const REVEAL_MARGIN_TOP = 72;
const REVEAL_MARGIN_BOTTOM = 56;

/**
 * Gère le clavier virtuel du téléphone :
 *  - pose `data-keyboard="open"` sur <html> tant que le clavier est ouvert : la barre de
 *    navigation du bas disparaît, l'en-tête cesse d'être collé en haut, les modales se
 *    compactent (variante Tailwind `kb:`, voir tailwind.config.ts et globals.css) ;
 *  - publie la zone visible dans --vvh (hauteur) et --vv-top (décalage) ;
 *  - amène le champ actif au centre de la zone visible, seulement s'il est caché ou trop près
 *    du bord.
 * Complète `interactiveWidget: 'resizes-content'` (layout.tsx), que Safari iOS ignore.
 */
export function KeyboardAware() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    let baseline = Math.max(window.innerHeight, vv?.height ?? 0);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;

    const visibleTop = () => vv?.offsetTop ?? 0;
    const visibleHeight = () => vv?.height ?? window.innerHeight;

    const revealActiveField = () => {
      const el = document.activeElement;
      if (!isTextField(el)) return;
      const rect = el.getBoundingClientRect();
      const top = visibleTop();
      const bottom = top + visibleHeight();
      const wellVisible = rect.top >= top + REVEAL_MARGIN_TOP && rect.bottom <= bottom - REVEAL_MARGIN_BOTTOM;
      if (!wellVisible) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };

    const update = () => {
      const height = visibleHeight();
      // Une rotation d'écran change la hauteur de référence : on la remesure hors clavier.
      if (!isTextField(document.activeElement)) baseline = Math.max(window.innerHeight, height);
      const open = isTextField(document.activeElement) && baseline - height > KEYBOARD_MIN_HEIGHT;
      if (open) {
        root.dataset.keyboard = 'open';
        root.style.setProperty('--vvh', `${Math.round(height)}px`);
        root.style.setProperty('--vv-top', `${Math.round(visibleTop())}px`);
      } else {
        delete root.dataset.keyboard;
        root.style.removeProperty('--vvh');
        root.style.removeProperty('--vv-top');
      }
    };

    // Un seul recalcul par image : « resize » et « scroll » du viewport arrivent en rafale.
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    const onFocusIn = (e: FocusEvent) => {
      if (!isTextField(e.target as Element)) return;
      update();
      // Laisse le clavier finir de s'ouvrir avant de faire défiler.
      clearTimeout(timer);
      timer = setTimeout(() => {
        update();
        revealActiveField();
      }, 350);
    };
    const onFocusOut = () => {
      clearTimeout(timer);
      // Petit délai : le focus passe souvent directement d'un champ au suivant.
      timer = setTimeout(update, 120);
    };
    const onViewportResize = () => {
      scheduleUpdate();
      // Le clavier se déploie en plusieurs étapes : on recale le champ une fois la taille stabilisée.
      clearTimeout(timer);
      timer = setTimeout(() => {
        update();
        if (root.dataset.keyboard === 'open') revealActiveField();
      }, 150);
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    vv?.addEventListener('resize', onViewportResize);
    vv?.addEventListener('scroll', scheduleUpdate);
    window.addEventListener('orientationchange', update);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      vv?.removeEventListener('resize', onViewportResize);
      vv?.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('orientationchange', update);
      delete root.dataset.keyboard;
      root.style.removeProperty('--vvh');
      root.style.removeProperty('--vv-top');
    };
  }, []);

  return null;
}
