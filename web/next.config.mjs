// v1.2 — « htmlLimitedBots » : Next.js 15.5 envoie par défaut les métadonnées (manifeste, icônes, couleur
// de la barre) APRÈS le début de la page, donc dans <body>. Or Chrome ne lit le manifeste que dans <head> :
// sans ce réglage il répond « no-manifest » et ne propose JAMAIS l'installation (et l'icône iPhone est perdue).
// L'expression « .* » désigne tous les visiteurs : les métadonnées restent toujours dans <head>.
// v1.1 — en-têtes du service worker (PWA) : toujours revalidé, pour que les mises à jour
// de l'application arrivent sans que l'administrateur n'ait à vider le cache.
/** @type {import('next').NextConfig} */
const nextConfig = {
  htmlLimitedBots: /.*/,
  images: {
    // Les photos de membres et logos sont servis depuis Cloudinary.
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
      },
    ];
  },
};

export default nextConfig;
