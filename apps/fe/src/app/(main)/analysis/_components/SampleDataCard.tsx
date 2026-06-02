import type { HTMLAttributes } from 'react';

export type SampleDataCardProps = {
  title: string;
  description?: string;
  onClick?: () => void;
} & Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'>;

const CARD_GRADIENT_OVERLAY =
  'linear-gradient(0deg, rgba(0, 0, 0, 0.40) 6.82%, rgba(128, 128, 128, 0.20) 51.23%, rgba(255, 255, 255, 0.00) 88.38%)';
const CARD_BACKGROUND = `${CARD_GRADIENT_OVERLAY}, #FFF`;

export default function SampleDataCard({
  title,
  description,
  onClick,
  onKeyDown,
  className = '',
  style,
  ...rest
}: SampleDataCardProps) {
  const isClickable = !!onClick;

  return (
    <div
      {...rest}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (event) => {
              onKeyDown?.(event);
              if (event.defaultPrevented) return;

              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick?.();
              }
            }
          : onKeyDown
      }
      style={{ ...style, background: CARD_BACKGROUND }}
      className={`relative h-[18.5rem] w-full overflow-hidden rounded-[2.4rem] ${
        isClickable
          ? 'cursor-pointer transition-transform hover:scale-[1.02]'
          : ''
      } ${className}`.trim()}
    >
      <div className="relative z-20 flex h-full flex-col items-start justify-end gap-2 px-[2.2rem] pt-[11.2rem] pb-[1.2rem]">
        <h3 className="text-head2 text-white">{title}</h3>
        {description && (
          <p className="line-clamp-1 w-full text-body2 text-white/80">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
