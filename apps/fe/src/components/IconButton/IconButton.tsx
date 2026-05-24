'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type IconButtonProps = {
  state?: 'empty' | 'default' | 'hover' | 'field';
  color?: 'default' | 'orange';
  icon?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'color'>;

function ArrowUpIcon() {
  return (
    <svg className="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19V5m0 0L6 11m6-6 6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      state = 'default',
      color = state === 'field' || state === 'hover' ? 'orange' : 'default',
      icon = <ArrowUpIcon />,
      disabled,
      className = '',
      type = 'button',
      ...rest
    },
    ref,
  ) {
    const isOrange = color === 'orange';
    const background =
      state === 'empty'
        ? 'bg-transparent text-gray-800'
        : isOrange
          ? state === 'hover'
            ? 'bg-orange-400 text-white'
            : 'bg-orange-500 text-white'
          : 'bg-gray-300 text-gray-900';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`inline-flex h-[3.8rem] w-[3.8rem] items-center justify-center rounded-12 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${background} ${className}`.trim()}
        {...rest}
      >
        {icon}
      </button>
    );
  },
);

export default IconButton;
