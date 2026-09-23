import type { Metadata } from 'next';
import './globals.css';
import { ASSOCIATION_NAME, ASSOCIATION_TAGLINE } from '@/lib/constants';

export const metadata: Metadata = {
  title: ASSOCIATION_NAME,
  description: ASSOCIATION_TAGLINE,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
