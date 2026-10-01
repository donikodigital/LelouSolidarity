//web/components/ui/Input.tsx
'use client';

import { InputHTMLAttributes, forwardRef, useState } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, type, ...props }, ref) => {
    const inputId = id || props.name;
    const isPassword = type === 'password';
    const [visible, setVisible] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-[13px] font-semibold text-ocean-800">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword ? (visible ? 'text' : 'password') : type}
            className={clsx(
              // text-base (16 px) sur mobile : évite le zoom automatique d'iOS au focus
              'w-full rounded-xl border bg-white px-3.5 py-3 text-base text-ocean-900 shadow-sm shadow-slate-900/[0.03]',
              'placeholder:text-slate-400 transition duration-150',
              'focus:outline-none focus:ring-4 sm:py-2.5 sm:text-sm',
              // Champ verrouillé : fond grisé, texte atténué, curseur « interdit »
              'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:shadow-none',
              isPassword && 'pr-11',
              error
                ? 'border-red-300 focus:border-red-400 focus:ring-red-200/50'
                : 'border-slate-200 hover:border-slate-300 focus:border-ocean-500 focus:ring-ocean-300/30',
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setVisible((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-ocean-600"
              aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && <span className="text-xs font-medium text-red-600">{error}</span>}
      </div>
    );
  },
);
Input.displayName = 'Input';