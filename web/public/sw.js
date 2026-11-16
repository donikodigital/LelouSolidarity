// web/public/sw.js — service worker de LELOU SOLIDARITY (v2).
// Rôles :
//  1. rendre l'application installable (Chrome / Edge / Samsung Internet exigent un gestionnaire « fetch ») ;
//  2. afficher une page claire (/offline.html) quand le téléphone n'a plus de réseau ;
//  3. accélérer les ouvertures : les fichiers de l'application (scripts, styles, polices, icônes)
//     sont gardés sur l'appareil.
// Ce qui n'est JAMAIS mis en cache : les pages, les données (membres, demandes, cartes) et les appels
// à l'API. Elles viennent toujours du serveur, donc jamais périmées et jamais visibles par un autre
// utilisateur de l'appareil.
const VERSION = 'v2';
const OFFLINE_CACHE = `ls-offline-${VERSION}`;
const STATIC_CACHE = `ls-static-${VERSION}`;
const OFFLINE_URL = '/offline.html';
// Éléments de la page hors connexion (le logo est facultatif : son absence n'empêche pas l'installation)
const OFFLINE_EXTRAS = ['/icons/icon-192.png', '/logo.png'];
const STATIC_MAX_ENTRIES = 150;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then(async (cache) => {
        await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
        await Promise.allSettled(OFFLINE_EXTRAS.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  const keep = [OFFLINE_CACHE, STATIC_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !keep.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

/** Garde au plus `max` entrées : les plus anciennes sont supprimées (évite l'accumulation après chaque mise à jour du site). */
async function trim(cache, max) {
  const keys = await cache.keys();
  if (keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map((key) => cache.delete(key)));
}

/** Fichiers au nom unique (/_next/static/...) : jamais modifiés, on les lit d'abord sur l'appareil. */
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    trim(cache, STATIC_MAX_ENTRIES);
  }
  return response;
}

/** Icônes et logo : affichés tout de suite depuis l'appareil, puis rafraîchis en arrière-plan. */
async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  if (cached) {
    event.waitUntil(refresh);
    return cached;
  }
  return refresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Ouverture d'une page : toujours le serveur ; page « hors connexion » si le réseau est coupé
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Le reste : seulement les fichiers statiques de ce site (jamais l'API, hébergée ailleurs)
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.startsWith('/icons/') || url.pathname === '/logo.png') {
    event.respondWith(staleWhileRevalidate(request, event));
  }
});
