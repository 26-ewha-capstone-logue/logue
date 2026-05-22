import { type ButtonHTMLAttributes, type ReactNode } from 'react';

export type MenuTabProps = {
  state?: 'default' | 'hover' | 'tap';
  icon?: ReactNode;
  children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

export default function MenuTab({
  state = 'default',
  icon,
  children = '메뉴명',
  className = '',
  ...rest
}: MenuTabProps) {
  const active = state === 'hover' || state === 'tap';

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-8 py-2 text-center transition-colors ${
        active
          ? 'text-head4 text-gray-900'
          : 'text-body1 text-gray-800 hover:text-gray-900'
      } ${state === 'hover' ? 'underline decoration-[0.1rem] underline-offset-4' : ''} ${className}`.trim()}
      {...rest}
    >
      {icon && (
        <span className="inline-flex shrink-0 items-center justify-center [&>svg]:icon-20">
          {icon}
        </span>
      )}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}
