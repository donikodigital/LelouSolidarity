//frontend/components/layout/PublicFooter.tsx
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { ASSOCIATION_NAME } from '@/lib/constants';

export function PublicFooter() {
  return (
    <footer className="border-t border-ocean-100 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-ocean-400 sm:flex-row">
        <p>
          &copy; {new Date().getFullYear()} {ASSOCIATION_NAME}
        </p>
        <Link
          href="/admin/login"
          className="inline-flex items-center gap-1.5 rounded-full border border-ocean-200 px-4 py-1.5 text-sm font-semibold text-ocean-600 transition-colors hover:border-ocean-300 hover:bg-ocean-50"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Espace administrateur
        </Link>
      </div>
    </footer>
  );
}