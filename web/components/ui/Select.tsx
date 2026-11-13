//web/components/ui/Select.tsx
// Liste déroulante au même style que Input (libellé, erreur, 16 px sur mobile pour éviter le zoom d'iOS).
'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const selectId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={selectId} className="text-[13px] font-semibold text-ocean-800">
          {label}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              'w-full appearance-none rounded-xl border bg-white px-3.5 py-3 pr-10 text-base text-ocean-900 shadow-sm shadow-slate-900/[0.03]',
              'transition duration-150 focus:outline-none focus:ring-4 sm:py-2.5 sm:text-sm',
              'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500',
              error
                ? 'border-red-300 focus:border-red-400 focus:ring-red-200/50'
                : 'border-slate-200 hover:border-slate-300 focus:border-ocean-500 focus:ring-ocean-300/30',
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
        {error && <span className="text-xs font-medium text-red-600">{error}</span>}
      </div>
    );
  },
);
Select.displayName = 'Select';
