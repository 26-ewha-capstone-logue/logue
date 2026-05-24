import { type HTMLAttributes } from 'react';

export type LooperProps = {
  active?: boolean;
} & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>;

export default function Looper({
  active = true,
  className = '',
  ...rest
}: LooperProps) {
  return (
    <span
      className={`inline-block h-24 w-24 rounded-full ${
        active
          ? 'animate-spin border-2 border-gray-300 border-t-orange-500'
          : 'bg-transparent'
      } ${className}`.trim()}
      aria-label={active ? '로딩 중' : undefined}
      {...rest}
    />
  );
}
