//web/components/pwa/InstallProvider.tsx
// v1.0 — installation de l'application (PWA).
//  - enregistre le service worker (/sw.js) en production ;
//  - capte l'évènement « beforeinstallprompt » dès l'ouverture du site (il n'est émis qu'une
//    fois : si on attendait d'être sur le tableau de bord, on le manquerait après la page de connexion) ;
//  - détecte iPhone / iPad (installation manuelle via « Partager ») et l'application déjà installée.
// Les composants lisent tout cela avec useInstall().
'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

interface InstallValue {
  /** L'application tourne déjà installée (plein écran) ou vient d'être installée. */
  installed: boolean;
  /** Le navigateur propose l'installation en un clic (Chrome, Edge, Samsung Internet...). */
  canPrompt: boolean;
  /** iPhone / iPad : installation manuelle depuis le menu Partager. */
  isIos: boolean;
  /** Il y a quelque chose à proposer à l'administrateur (installation en un clic ou guide iPhone). */
  available: boolean;
  /** Ouvre la fenêtre d'installation du navigateur. */
  promptInstall: () => Promise<InstallOutcome>;
}

const InstallContext = createContext<InstallValue | null>(null);

function isRunningInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectIos(): boolean {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  // iPadOS 13+ se présente comme un Mac, mais possède un écran tactile
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

export function InstallProvider({ children }: { children: ReactNode }) {
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setInstalled(isRunningInstalled());
    setIsIos(detectIos());

    function onBeforeInstall(event: Event) {
      // Empêche la mini-barre du navigateur : on propose notre propre bannière, au bon moment
      event.preventDefault();
      deferred.current = event as BeforeInstallPromptEvent;
      setCanPrompt(true);
    }
    function onInstalled() {
      deferred.current = null;
      setCanPrompt(false);
      setInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    // Le service worker rend l'application installable et affiche une page claire hors connexion.
    // En développement (next dev) on ne l'enregistre pas : il gênerait le rechargement à chaud.
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch(() => {
          /* sans service worker, le site fonctionne normalement */
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    const event = deferred.current;
    if (!event) return 'unavailable';
    // Un évènement ne sert qu'une seule fois : le navigateur en renverra un autre plus tard
    deferred.current = null;
    setCanPrompt(false);
    try {
      await event.prompt();
      const { outcome } = await event.userChoice;
      return outcome;
    } catch {
      return 'unavailable';
    }
  }, []);

  const value = useMemo<InstallValue>(
    () => ({
      installed,
      canPrompt,
      isIos,
      available: !installed && (canPrompt || isIos),
      promptInstall,
    }),
    [installed, canPrompt, isIos, promptInstall],
  );

  return <InstallContext.Provider value={value}>{children}</InstallContext.Provider>;
}

export function useInstall(): InstallValue {
  const ctx = useContext(InstallContext);
  if (!ctx) throw new Error('useInstall doit être utilisé dans <InstallProvider>');
  return ctx;
}
