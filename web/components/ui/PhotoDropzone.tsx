//web/components/ui/PhotoDropzone.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { UploadCloud, X, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

interface PhotoDropzoneProps {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

export function PhotoDropzone({ file, onChange, error }: PhotoDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      const candidate = fileList?.[0];
      if (!candidate) return;

      if (!ALLOWED_TYPES.includes(candidate.type)) {
        setLocalError('Format non supporté : utilisez une photo JPG ou PNG.');
        return;
      }
      if (candidate.size > MAX_BYTES) {
        setLocalError('La photo dépasse 10 Mo, merci d’en choisir une plus légère.');
        return;
      }
      setLocalError(null);
      onChange(candidate);
    },
    [onChange],
  );

  const shownError = error || localError || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-ocean-800">Photo d&apos;identité</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-all duration-200',
          dragActive
            ? 'border-[#D8B65C] bg-amber-50/60'
            : 'border-slate-200 bg-slate-50/60 hover:border-ocean-300 hover:bg-ocean-50/50',
          shownError && 'border-red-300',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {preview ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={preview}
              alt="Aperçu"
              className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-card ring-2 ring-[#D8B65C]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ocean-50 px-3 py-1.5 text-xs font-semibold text-ocean-700 hover:bg-ocean-100"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Remplacer
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
              >
                <X className="h-3.5 w-3.5" /> Retirer
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-ocean-500 to-ocean-700 text-white shadow-md shadow-ocean-700/25 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-ocean-700">
              Touchez ou glissez votre photo ici
            </p>
            <p className="text-xs text-ocean-400">JPG ou PNG, 10 Mo maximum</p>
          </>
        )}
      </div>
      {shownError && <span className="text-xs font-medium text-red-600">{shownError}</span>}
    </div>
  );
}