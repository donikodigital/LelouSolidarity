//backend/src/cards/browser.util.ts
// v1.1 — le navigateur Chromium est conservé entre deux cartes (il se ferme tout
// seul après 90 s d'inactivité) : seule la première carte paie le lancement,
// qui est l'étape la plus lente sur un petit serveur.
import chromium from '@sparticuz/chromium';
import puppeteer, { Browser } from 'puppeteer-core';

const IDLE_CLOSE_MS = 90_000;

let sharedBrowser: Promise<Browser> | null = null;
let activeUsers = 0;
let idleTimer: NodeJS.Timeout | null = null;

/**
 * Lance une instance Chromium adaptée à l'environnement :
 * - En production (Render, Linux) : chromium "serverless" fourni par
 *   @sparticuz/chromium, sans dépendance système à installer.
 * - En local (ex. Windows, poste de Doniko) : définir la variable d'env
 *   PUPPETEER_EXECUTABLE_PATH vers un Chrome/Chromium déjà installé,
 *   par exemple "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe".
 */
export async function launchBrowser(): Promise<Browser> {
  const customPath = process.env.PUPPETEER_EXECUTABLE_PATH;

  if (customPath) {
    return puppeteer.launch({
      executablePath: customPath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  // Mode « sans graphismes » : pas besoin de WebGL pour imprimer un PDF, et cela
  // évite de décompresser les bibliothèques graphiques (démarrage plus rapide,
  // moins de mémoire). Sans effet si la version installée ne le gère pas.
  (chromium as unknown as { setGraphicsMode: boolean }).setGraphicsMode = false;

  const executablePath = await chromium.executablePath();
  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
  });
}

/**
 * Renvoie le navigateur partagé (le lance si besoin). Chaque appel doit être
 * suivi d'un releaseBrowser() une fois la page fermée.
 */
export async function getBrowser(): Promise<Browser> {
  activeUsers += 1;
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }

  try {
    if (sharedBrowser) {
      try {
        const existing = await sharedBrowser;
        if (existing.connected) return existing;
      } catch {
        /* le lancement précédent a échoué : on relance */
      }
      sharedBrowser = null;
    }

    const launching = launchBrowser();
    sharedBrowser = launching;
    launching.catch(() => {
      if (sharedBrowser === launching) sharedBrowser = null;
    });

    const browser = await launching;
    browser.on('disconnected', () => {
      if (sharedBrowser === launching) sharedBrowser = null;
    });
    return browser;
  } catch (err) {
    activeUsers = Math.max(0, activeUsers - 1);
    throw err;
  }
}

/** À appeler quand on a fini avec le navigateur : il se ferme après 90 s sans utilisation. */
export function releaseBrowser(): void {
  activeUsers = Math.max(0, activeUsers - 1);
  if (activeUsers > 0) return;

  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    idleTimer = null;
    const current = sharedBrowser;
    sharedBrowser = null;
    if (!current) return;
    try {
      await (await current).close();
    } catch {
      /* déjà fermé */
    }
  }, IDLE_CLOSE_MS);
  idleTimer.unref?.();
}