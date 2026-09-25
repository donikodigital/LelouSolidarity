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
        setLocalError('Format non supporte : utilisez une photo JPG ou PNG.');
        return;
      }
      if (candidate.size > MAX_BYTES) {
        setLocalError('La photo depasse 10 Mo, merci d\u2019en choisir une plus legere.');
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
      <label className="text-sm font-medium text-ocean-800">Photo d&apos;identite</label>
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
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
          dragActive ? 'border-ocean-400 bg-ocean-50' : 'border-slate-200 bg-slate-50/60',
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
              alt="Apercu"
              className="h-24 w-24 rounded-full border-2 border-white object-cover shadow-card"
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
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ocean-50 text-ocean-500">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-ocean-700">
              Cliquez ou glissez votre photo ici
            </p>
            <p className="text-xs text-ocean-400">JPG ou PNG, 10 Mo maximum</p>
          </>
        )}
      </div>
      {shownError && <span className="text-xs font-medium text-red-600">{shownError}</span>}
    </div>
  );
}
