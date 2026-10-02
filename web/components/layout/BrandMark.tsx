//web/components/layout/BrandMark.tsx
// v1.1 — affiche le logo officiel (au lieu du badge « LS ») partout où
// BrandMark est utilisé : connexion admin, en-têtes, etc.
import { Logo } from './Logo';

const SIZES = { sm: 36, md: 48, lg: 64 };

export function BrandMark({
  size = 'md',
  onDark = true,
}: {
  size?: 'sm' | 'md' | 'lg';
  onDark?: boolean;
}) {
  return (
    <Logo
      size={SIZES[size]}
      className={onDark ? 'ring-2 ring-[#D8B65C]/80' : 'ring-2 ring-[#D8B65C]'}
    />
  );
}