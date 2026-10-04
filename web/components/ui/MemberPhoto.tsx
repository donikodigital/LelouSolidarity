//web/components/ui/MemberPhoto.tsx
'use client';

import { useState } from 'react';
import { User } from 'lucide-react';

interface MemberPhotoProps {
  src: string;
  // Photo d'origine, essayée si la version réduite ne charge pas
  fallbackSrc?: string | null;
  alt: string;
}

// Photo du membre dans un cadre or, au même format que sur la carte (20 x 24,5).
// Si aucune image ne peut être chargée, un pictogramme discret la remplace.
export function MemberPhoto({ src, fallbackSrc, alt }: MemberPhotoProps) {
  const [current, setCurrent] = useState(src);
  const [failed, setFailed] = useState(false);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#F3E2A9] via-[#D8B65C] to-[#9A7B2F] p-1 shadow-lg shadow-ocean-900/20">
      <div className="aspect-[20/24.5] w-32 overflow-hidden rounded-[0.875rem] bg-ocean-50 sm:w-36">
        {failed ? (
          <div className="flex h-full w-full items-center justify-center text-ocean-300">
            <User className="h-12 w-12" />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => {
              if (fallbackSrc && current !== fallbackSrc) setCurrent(fallbackSrc);
              else setFailed(true);
            }}
          />
        )}
      </div>
    </div>
  );
}