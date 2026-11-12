//web/components/admin/Avatar.tsx
// Photo ronde du gérant ; à défaut (ou si l'image ne charge pas), ses initiales sur fond bleu.
'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { initialsOf } from '@/lib/profile';

interface AvatarProps {
  name?: string | null;
  email: string;
  src?: string | null;
  /** Diamètre en pixels. */
  size?: number;
  /** Anneau doré autour de la photo. */
  ring?: boolean;
  className?: string;
}

export function Avatar({ name, email, src, size = 40, ring, className }: AvatarProps) {
  // Mémorise l'adresse en échec : une nouvelle photo (autre adresse) est de nouveau tentée
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = !!src && failedSrc !== src;

  return (
    <span
      className={clsx(
        'relative inline-flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-ocean-400 to-ocean-700 font-extrabold text-white select-none',
        ring && 'ring-[3px] ring-[#D8B65C] ring-offset-2 ring-offset-transparent',
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.38)) }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailedSrc(src as string)}
        />
      ) : (
        initialsOf(name, email)
      )}
    </span>
  );
}
