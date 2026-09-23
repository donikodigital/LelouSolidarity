import { HTMLAttributes } from 'react';
import clsx from 'clsx';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-xl2 bg-white shadow-card border border-ocean-100/60',
        className,
      )}
      {...props}
    />
  );
}
