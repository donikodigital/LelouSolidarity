import clsx from 'clsx';

export function BrandMark({
  size = 'md',
  onDark = true,
}: {
  size?: 'sm' | 'md' | 'lg';
  onDark?: boolean;
}) {
  const dims = { sm: 'h-8 w-8 text-[11px]', md: 'h-11 w-11 text-sm', lg: 'h-14 w-14 text-base' };
  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-full font-extrabold tracking-tight',
        dims[size],
        onDark ? 'bg-white text-ocean-600' : 'bg-ocean-600 text-white',
      )}
    >
      LS
    </div>
  );
}
