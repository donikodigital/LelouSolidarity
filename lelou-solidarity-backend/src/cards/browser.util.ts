import chromium from '@sparticuz/chromium';
import puppeteer, { Browser } from 'puppeteer-core';

/**
 * Lance une instance Chromium adaptee a l'environnement :
 * - En production (Render, Linux) : chromium "serverless" fourni par
 *   @sparticuz/chromium, sans dependance systeme a installer.
 * - En local (ex. Windows, poste de Doniko) : definir la variable d'env
 *   PUPPETEER_EXECUTABLE_PATH vers un Chrome/Chromium deja installe,
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

  const executablePath = await chromium.executablePath();
  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
  });
}
