//frontend/app/admin/(auth)/layout.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-ocean-700 via-ocean-600 to-ocean-500 px-6">
      <Link
        href="/"
        className="absolute left-6 top-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>
      {children}
    </main>
  );
}