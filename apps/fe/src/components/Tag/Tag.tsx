import { type HTMLAttributes, type ReactNode } from 'react';

type TagVariant = 'orange' | 'blue' | 'gray' | 'error';

export type TagProps = {
  variant?: TagVariant;
  icon?: ReactNode;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>;

const variantClass: Record<TagVariant, string> = {
  orange: 'bg-orange-100 text-orange-600',
  blue: 'bg-blue-100 text-blue-600',
  gray: 'bg-gray-200 text-gray-700',
  error: 'bg-[#ffe5e5] text-error-500',
};

export default function Tag({
  variant = 'orange',
  icon,
  children,
  className = '',
  ...rest
}: TagProps) {
  return (
    <span
      className={`inline-flex items-center gap-4 rounded-[22.2rem] px-12 py-4 text-body4 font-semibold ${variantClass[variant]} ${className}`.trim()}
      {...rest}
    >
      {icon && <span className="inline-flex shrink-0 [&>svg]:icon-16">{icon}</span>}
      {children}
    </span>
  );
}
