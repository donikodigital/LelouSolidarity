/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Les photos de membres et logos sont servis depuis Cloudinary.
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;
