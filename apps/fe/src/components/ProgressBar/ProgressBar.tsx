import { type HTMLAttributes } from 'react';

export type ProgressBarProps = {
  step?: 1 | 2 | 3;
  total?: 3;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

export default function ProgressBar({
  step = 1,
  total = 3,
  className = '',
  ...rest
}: ProgressBarProps) {
  return (
    <div
      className={`flex items-center gap-4 ${className}`.trim()}
      aria-label={`${total}단계 중 ${step}단계`}
      {...rest}
    >
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={`h-[0.6rem] w-[11rem] rounded-12 ${
            index < step ? 'bg-orange-400' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );
}
