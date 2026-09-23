import { ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl2 border border-dashed border-ocean-200 bg-ocean-50/40 py-16 text-center">
      {icon && <div className="text-ocean-300">{icon}</div>}
      <p className="text-base font-semibold text-ocean-800">{title}</p>
      {description && <p className="max-w-sm text-sm text-ocean-500">{description}</p>}
    </div>
  );
}
