import { type HTMLAttributes, type ReactNode } from 'react';

type IconBoxVariant = 'orange' | 'blue' | 'gray';
type IconBoxSize = 'sm' | 'md' | 'lg';

export type IconBoxProps = {
  /** 아이콘(SVG 등) */
  icon: ReactNode;
  /** 배경색 */
  variant?: IconBoxVariant;
  /** 크기 */
  size?: IconBoxSize;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

const variantClasses: Record<IconBoxVariant, string> = {
  orange: 'bg-orange-500',
  blue: 'bg-blue-500',
  gray: 'bg-gray-300',
};

const sizeClasses: Record<IconBoxSize, string> = {
  sm: 'h-[3rem] w-[3rem] rounded-8 [&>svg]:icon-16',
  md: 'h-[3.8rem] w-[3.8rem] rounded-12 [&>svg]:icon-20',
  lg: 'h-[4.8rem] w-[4.8rem] rounded-16 [&>svg]:icon-28',
};

export default function IconBox({
  icon,
  variant = 'orange',
  size = 'md',
  className = '',
  ...rest
}: IconBoxProps) {
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center text-white ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      {...rest}
    >
      {icon}
    </div>
  );
}
