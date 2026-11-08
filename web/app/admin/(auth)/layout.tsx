//frontend/app/admin/(auth)/layout.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { getT } from '@/lib/i18n/server';

export default async function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getT();
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-ocean-700 via-ocean-600 to-ocean-500 px-6">
      <Link
        href="/"
        className="absolute left-4 top-5 inline-flex items-center gap-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.admin.auth.backHome}
      </Link>
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <LanguageSwitcher align="right" />
      </div>
      {children}
    </main>
  );
}
