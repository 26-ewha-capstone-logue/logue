import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'cta' | 'primary' | 'outlined' | 'text';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const ctaClass =
  'inline-flex h-auto w-[35rem] shrink-0 items-center justify-center gap-2 rounded-[22.2rem] bg-orange-500 px-20 py-12 text-center text-body2 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-background-disabled disabled:text-gray-900';

const primaryBaseClass =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-[22.2rem] bg-orange-500 text-center text-body2 font-semibold text-white transition-colors hover:bg-white hover:text-orange-500 disabled:cursor-not-allowed disabled:bg-background-disabled disabled:text-gray-900 disabled:hover:bg-background-disabled disabled:hover:text-gray-900';

const outlinedBaseClass =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-[22.2rem] border border-gray-400 bg-white text-center text-body2 font-semibold text-gray-800 transition-colors hover:border-orange-500 hover:text-orange-500 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-500';

const textBaseClass =
  'inline-flex shrink-0 items-center justify-center gap-2 bg-transparent text-center text-body2 font-semibold text-gray-700 transition-colors hover:text-orange-500 disabled:cursor-not-allowed disabled:text-gray-400';

const sizeClass: Record<ButtonSize, string> = {
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
  const baseMap: Record<ButtonVariant, string> = {
    cta: ctaClass,
    primary: primaryBaseClass,
    outlined: outlinedBaseClass,
    text: textBaseClass,
  };

  const needsSize = variant !== 'cta';
  const styles = `${baseMap[variant]} ${needsSize ? sizeClass[size] : ''} ${fullWidth ? 'w-full' : ''}`;

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
