import { type HTMLAttributes, type ReactNode } from 'react';

type CardVariant = 'dash' | 'intro' | 'news';

export type CardProps = {
  title: string;
  description?: string;
  thumbnail?: ReactNode;
  onClick?: () => void;
  variant?: CardVariant;
  label?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'>;

const CARD_GRADIENT_OVERLAY =
  'linear-gradient(0deg, rgba(0, 0, 0, 0.40) 6.82%, rgba(128, 128, 128, 0.20) 51.23%, rgba(255, 255, 255, 0.00) 88.38%)';

const CARD_BACKGROUND = `${CARD_GRADIENT_OVERLAY}, #FFF`;

const variantClass: Record<CardVariant, string> = {
  dash: 'h-[18.5rem] w-full rounded-[2.4rem]',
  intro: 'h-[30rem] w-[30rem] rounded-20',
  news: 'h-[32rem] w-[60rem] rounded-20',
};

export default function Card({
  title,
  description,
  thumbnail,
  onClick,
  variant = 'dash',
  label,
  className = '',
  ...rest
}: CardProps) {
  const isClickable = !!onClick;
  const isDash = variant === 'dash';

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      style={{ background: thumbnail ? '#FFF' : CARD_BACKGROUND }}
      className={`relative overflow-hidden ${variantClass[variant]} ${
        isClickable
          ? 'cursor-pointer transition-transform hover:scale-[1.02]'
          : ''
      } ${className}`.trim()}
      {...rest}
    >
      {thumbnail && (
        <>
          <div className="pointer-events-none absolute inset-0 z-0">
            {thumbnail}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10"
            style={{ background: CARD_GRADIENT_OVERLAY }}
          />
        </>
      )}

      {label && (
        <span className="absolute left-32 top-[17.3rem] z-20 rounded-222 bg-orange-500 px-12 py-8 text-body2 text-white">
          {label}
        </span>
      )}

      <div
        className={`relative z-20 flex h-full flex-col items-start justify-end ${
          isDash ? 'gap-2 px-[2.2rem] pt-[11.2rem] pb-[1.2rem]' : 'gap-8 p-32'
        }`}
      >
        <h3
          className={`${
            isDash ? 'text-head2' : 'text-head2 font-extrabold'
          } text-white`}
        >
          {title}
        </h3>
        {description && (
          <p
            className={`${
              isDash ? 'line-clamp-1 w-full text-white/80' : 'text-white'
            } text-body2`}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
