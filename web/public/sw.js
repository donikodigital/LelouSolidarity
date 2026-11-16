// web/public/sw.js — service worker minimal de LELOU SOLIDARITY.
// Rôle : rendre l'application installable et afficher une page claire (/offline.html)
// quand le téléphone n'a plus de réseau. Aucun fichier du site n'est mis en cache :
// les données (membres, cartes) et les pages sont toujours celles du serveur, donc jamais périmées.
const CACHE = 'ls-offline-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  // Seules les ouvertures de pages sont concernées ; images, scripts et API passent tels quels.
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});
