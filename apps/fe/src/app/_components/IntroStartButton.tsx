'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type IntroStartButtonProps = {
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function IntroStartButton({
  children = 'Logue 체험하기',
  className = '',
  ...props
}: IntroStartButtonProps) {
  return (
    <button
      type="button"
      className={`self-start rounded-full bg-orange-500 px-24 py-12 text-body2 font-semibold text-white transition-colors hover:bg-orange-600 ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
