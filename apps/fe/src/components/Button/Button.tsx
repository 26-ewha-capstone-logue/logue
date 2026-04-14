import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'cta' | 'primary';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  variant?: ButtonVariant;
  /** primary(일반 버튼)만 S/M/L. cta는 고정 규격이라 무시됨 */
  size?: ButtonSize;
  fullWidth?: boolean;
  /** 왼쪽 아이콘(SVG 등). 없으면 children만 표시 */
  icon?: ReactNode;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

/* ── CTA ──
 * 고정 너비 35rem, py-12 px-20, gap-2, pill
 * default: orange-500 / disabled: #999 / hover 없음
 */
const ctaClass =
  'inline-flex h-auto w-[35rem] shrink-0 items-center justify-center gap-2 rounded-[22.2rem] bg-orange-500 px-20 py-12 text-center text-body2 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-background-disabled disabled:text-gray-900';

/* ── 일반 버튼 ──
 * inline-flex, pill, gap-2
 * default: orange-500 / hover: white bg + orange text / disabled: #999
 */
const primaryBaseClass =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-[22.2rem] bg-orange-500 text-center text-body2 font-semibold text-white transition-colors hover:bg-white hover:text-orange-500 disabled:cursor-not-allowed disabled:bg-background-disabled disabled:text-gray-900 disabled:hover:bg-background-disabled disabled:hover:text-gray-900';

const primarySizeClass: Record<ButtonSize, string> = {
  sm: 'py-8 px-12',
  md: 'py-8 px-16',
  lg: 'py-12 px-16',
};

const iconWrapClass =
  'inline-flex shrink-0 items-center justify-center text-current [&>svg]:icon-20';

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    icon,
    className = '',
    type = 'button',
    disabled,
    children,
    ...rest
  },
  ref,
) {
  const isCta = variant === 'cta';

  const styles = isCta
    ? ctaClass
    : `${primaryBaseClass} ${primarySizeClass[size]} ${fullWidth ? 'w-full' : ''}`;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`${styles} ${className}`.trim()}
      {...rest}
    >
      {icon != null && icon !== false ? (
        <span className={iconWrapClass} aria-hidden>
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
});

export default Button;
