//backend/src/cards/browser.util.ts
// v1.2 — adapté à une instance de 512 Mo (Render) :
//  - Chromium n'est plus gardé 90 s en mémoire : il se ferme 3 s après la dernière
//    carte (juste assez pour enchaîner deux cartes sans le relancer) ;
//  - fermeture « dure » (SIGKILL) si Chromium ne répond pas à close() ;
//  - options supplémentaires pour réduire la mémoire (pas de GPU, pas de
//    rastériseur logiciel).
// v1.1 — le navigateur Chromium est conservé entre deux cartes.
import chromium from '@sparticuz/chromium';
import puppeteer, { Browser } from 'puppeteer-core';

const IDLE_CLOSE_MS = 3_000;
const CLOSE_TIMEOUT_MS = 5_000;

// Inutiles pour imprimer un PDF, et ils coûtent de la mémoire.
const LOW_MEMORY_ARGS = ['--disable-gpu', '--disable-software-rasterizer'];

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
      args: ['--no-sandbox', '--disable-setuid-sandbox', ...LOW_MEMORY_ARGS],
    });
  }

  // Mode « sans graphismes » : pas besoin de WebGL pour imprimer un PDF, et cela
  // évite de décompresser les bibliothèques graphiques (démarrage plus rapide,
  // moins de mémoire). Sans effet si la version installée ne le gère pas.
  (chromium as unknown as { setGraphicsMode: boolean }).setGraphicsMode = false;

  const executablePath = await chromium.executablePath();
  return puppeteer.launch({
    args: [...chromium.args, ...LOW_MEMORY_ARGS],
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
  });
}

/** Ferme Chromium et, s'il ne répond pas, tue le processus pour libérer la mémoire. */
async function closeQuietly(browser: Browser): Promise<void> {
  const proc = browser.process();
  try {
    const timeout = new Promise<void>((resolve) => {
      const t = setTimeout(resolve, CLOSE_TIMEOUT_MS);
      t.unref?.();
    });
    await Promise.race([browser.close(), timeout]);
  } catch {
    /* déjà fermé */
  }
  if (proc && proc.exitCode === null && !proc.killed) {
    proc.kill('SIGKILL');
  }
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

/** À appeler quand on a fini avec le navigateur : il se ferme 3 s après la dernière utilisation. */
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
      await closeQuietly(await current);
    } catch {
      /* lancement échoué ou déjà fermé */
    }
  }, IDLE_CLOSE_MS);
  idleTimer.unref?.();
}