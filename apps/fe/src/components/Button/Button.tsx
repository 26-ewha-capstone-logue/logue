import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'cta' | 'primary' | 'outlined' | 'text';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const ctaClass =
  'inline-flex h-[4.9rem] w-[35rem] shrink-0 items-center justify-center gap-2 rounded-[22.2rem] bg-orange-500 px-20 py-12 text-center text-head5 text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-700';

const primaryBaseClass =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-[22.2rem] bg-orange-500 text-center text-white transition-colors hover:bg-white hover:text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-700 disabled:hover:bg-gray-400 disabled:hover:text-gray-700';

const outlinedBaseClass =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-[22.2rem] border border-gray-400 bg-white text-center text-gray-900 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-500';

const textBaseClass =
  'inline-flex shrink-0 items-center justify-center gap-2 bg-transparent text-center text-body2 font-semibold text-gray-700 transition-colors hover:text-orange-500 disabled:cursor-not-allowed disabled:text-gray-400';

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-12 py-8 text-body2',
  md: 'px-16 py-8 text-body1',
  lg: 'px-16 py-12 text-head5',
};

const iconSizeClass: Record<ButtonSize, string> = {
  sm: '[&>svg]:icon-16',
  md: '[&>svg]:icon-16',
  lg: '[&>svg]:icon-20',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    icon,
    leftIcon,
    rightIcon,
    className = '',
    type = 'button',
    disabled,
    children,
    ...rest
  },
  ref,
) {
  const baseMap: Record<ButtonVariant, string> = {
    cta: ctaClass,
    primary: primaryBaseClass,
    outlined: outlinedBaseClass,
    text: textBaseClass,
  };

  const needsSize = variant !== 'cta';
  const styles = `${baseMap[variant]} ${needsSize ? sizeClass[size] : ''} ${fullWidth ? 'w-full' : ''}`;
  const startIcon = leftIcon ?? icon;
  const iconWrapClass = `inline-flex shrink-0 items-center justify-center text-current ${iconSizeClass[size]}`;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`${styles} ${className}`.trim()}
      {...rest}
    >
      {startIcon != null && startIcon !== false ? (
        <span className={iconWrapClass} aria-hidden>
          {startIcon}
        </span>
      ) : null}
      {children}
      {rightIcon != null && rightIcon !== false ? (
        <span className={iconWrapClass} aria-hidden>
          {rightIcon}
        </span>
      ) : null}
    </button>
  );
});

export default Button;
