// v1.1 — en-têtes du service worker (PWA) : toujours revalidé, pour que les mises à jour
// de l'application arrivent sans que l'administrateur n'ait à vider le cache.
/** @type {import('next').NextConfig} */
const nextConfig = {
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
