//web/components/layout/KeyboardAware.tsx
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

/**
 * Gère le clavier virtuel du téléphone :
 *  - amène le champ actif au centre de la zone visible (le clavier ne le cache plus) ;
 *  - pose `data-keyboard="open"` sur <html> tant que le clavier est ouvert, ce qui
 *    permet de masquer la barre de navigation flottante du bas (voir globals.css).
 * Complète `interactiveWidget: 'resizes-content'` (layout.tsx), que Safari iOS ignore.
 */
export function KeyboardAware() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;
    let baseline = Math.max(window.innerHeight, vv?.height ?? 0);
    let timer: ReturnType<typeof setTimeout> | undefined;

    const revealActiveField = () => {
      const el = document.activeElement;
      if (isTextField(el)) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };

    const update = () => {
      const height = vv?.height ?? window.innerHeight;
      // Une rotation d'écran change la hauteur de référence : on la remesure hors clavier.
      if (!isTextField(document.activeElement)) baseline = Math.max(window.innerHeight, height);
      const open = isTextField(document.activeElement) && baseline - height > 140;
      if (open) root.dataset.keyboard = 'open';
      else delete root.dataset.keyboard;
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
      update();
      if (root.dataset.keyboard === 'open') revealActiveField();
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    vv?.addEventListener('resize', onViewportResize);
    window.addEventListener('orientationchange', update);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      vv?.removeEventListener('resize', onViewportResize);
      window.removeEventListener('orientationchange', update);
      delete root.dataset.keyboard;
    };
  }, []);

  return null;
}
