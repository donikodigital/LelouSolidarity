import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-ocean-800">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ocean-900 placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-ocean-300 focus:border-ocean-400',
            error ? 'border-red-300' : 'border-slate-200',
            className,
          )}
          {...props}
        />
        {error && <span className="text-xs font-medium text-red-600">{error}</span>}
      </div>
    );
  },
);
Input.displayName = 'Input';
