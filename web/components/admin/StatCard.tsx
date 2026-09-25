import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'ocean',
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone?: 'ocean' | 'amber' | 'emerald' | 'red' | 'slate';
}) {
  const tones: Record<string, string> = {
    ocean: 'bg-ocean-50 text-ocean-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={clsx('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full', tones[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-ocean-800">{value}</p>
        <p className="text-xs font-medium text-ocean-400">{label}</p>
      </div>
    </Card>
  );
}
