//web/components/layout/PublicFooter.tsx
// v1.1 — le bouton « Espace administrateur » n'est plus ici : il est en haut
// à droite de la page d'accueil.
import { ASSOCIATION_NAME } from '@/lib/constants';

export function PublicFooter() {
  return (
    <footer className="border-t border-ocean-100 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-center px-6 py-8 text-sm text-ocean-400">
        <p>
          &copy; {new Date().getFullYear()} {ASSOCIATION_NAME}
        </p>
      </div>
    </footer>
  );
}