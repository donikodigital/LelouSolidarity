import Link from 'next/link';
import { ASSOCIATION_NAME } from '@/lib/constants';

export function PublicFooter() {
  return (
    <footer className="border-t border-ocean-100 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-ocean-400 sm:flex-row">
        <p>
          &copy; {new Date().getFullYear()} {ASSOCIATION_NAME}
        </p>
        <Link href="/admin/login" className="text-ocean-400 transition-colors hover:text-ocean-600">
          Espace administrateur
        </Link>
      </div>
    </footer>
  );
}
