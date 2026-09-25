//components/ui/Input.tsx
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
        <label htmlFor={inputId} className="text-sm font-medium text-ocean-800">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword ? (visible ? 'text' : 'password') : type}
            className={clsx(
              'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ocean-900 placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-ocean-400',
              isPassword && 'pr-10',
              error ? 'border-red-300' : 'border-slate-200',
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