'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, KeyRound, LogOut, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { BrandMark } from '@/components/layout/BrandMark';
import { useSession } from './SessionProvider';
import { ASSOCIATION_NAME } from '@/lib/constants';

const links = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/admin/membres', label: 'Membres', icon: Users },
  { href: '/admin/codes', label: "Codes d'acces", icon: KeyRound },
];

export function Sidebar() {
  const pathname = usePathname();
  const { session, logout } = useSession();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {links.map((link) => {
        const active = link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={clsx(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-white text-ocean-700 shadow-sm'
                : 'text-ocean-100 hover:bg-ocean-600/60 hover:text-white',
            )}
          >
            <link.icon className="h-4.5 w-4.5" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Barre mobile */}
      <div className="flex items-center justify-between border-b border-ocean-100 bg-ocean-700 px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-2.5">
          <BrandMark size="sm" />
          <span className="text-sm font-bold">{ASSOCIATION_NAME}</span>
        </div>
        <button onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Panneau mobile (drawer) */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-ocean-700 py-4">
            <div className="mb-4 flex items-center justify-between px-4">
              <div className="flex items-center gap-2.5">
                <BrandMark size="sm" />
                <span className="text-sm font-bold text-white">{ASSOCIATION_NAME}</span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Fermer le menu" className="text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            <div className="mt-auto px-3 pt-4">
              <SidebarFooter email={session.admin.email} onLogout={logout} />
            </div>
          </div>
        </div>
      )}

      {/* Barre laterale desktop */}
      <aside className="hidden w-64 flex-shrink-0 flex-col bg-ocean-700 py-6 lg:flex">
        <div className="mb-6 flex items-center gap-2.5 px-4">
          <BrandMark size="sm" />
          <span className="text-sm font-bold text-white">{ASSOCIATION_NAME}</span>
        </div>
        {nav}
        <div className="mt-auto px-3 pt-6">
          <SidebarFooter email={session.admin.email} onLogout={logout} />
        </div>
      </aside>
    </>
  );
}

function SidebarFooter({ email, onLogout }: { email: string; onLogout: () => void }) {
  return (
    <div className="rounded-xl bg-ocean-600/50 p-3">
      <p className="truncate text-xs font-medium text-ocean-100">{email}</p>
      <button
        onClick={onLogout}
        className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-ocean-100 hover:bg-ocean-600"
      >
        <LogOut className="h-3.5 w-3.5" />
        Se deconnecter
      </button>
    </div>
  );
}
