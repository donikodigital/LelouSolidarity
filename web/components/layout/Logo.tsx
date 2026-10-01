//web/components/layout/Logo.tsx
import Image from 'next/image';
import clsx from 'clsx';

interface LogoProps {
  /** Taille d'affichage en pixels (le fichier source fait 512 px). */
  size?: number;
  /** Ajoute le liseré or autour du logo. */
  ring?: boolean;
  priority?: boolean;
  className?: string;
}

/**
 * Logo officiel LELOU SOLIDARITY, INC. (fichier : web/public/logo.png).
 */
export function Logo({ size = 64, ring = false, priority = false, className }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Logo LELOU SOLIDARITY, INC."
      width={size}
      height={size}
      priority={priority}
      className={clsx(
        'rounded-full',
        ring && 'ring-2 ring-[#D8B65C] ring-offset-4 ring-offset-white shadow-lg shadow-ocean-900/20',
        className,
      )}
    />
  );
}