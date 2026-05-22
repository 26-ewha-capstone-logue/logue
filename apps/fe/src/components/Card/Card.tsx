import { type HTMLAttributes, type ReactNode } from 'react';

type CardVariant = 'dash' | 'intro' | 'news';

export type CardProps = {
  /** 분야명 (굵은 제목) */
  title: string;
  /** 세부 설명 (1줄) */
  description?: string;
  /** 카드 상단에 표시할 이미지/콘텐츠 */
  thumbnail?: ReactNode;
  /** 클릭 콜백 */
  onClick?: () => void;
  variant?: CardVariant;
  label?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'>;

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
  const sizeClass = {
    dash: 'h-[18.5rem] w-[28.1rem] rounded-[2.4rem]',
    intro: 'h-[30rem] w-[30rem] rounded-20',
    news: 'h-[32rem] w-[60rem] rounded-20',
  } satisfies Record<CardVariant, string>;

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
      className={`group relative flex overflow-hidden bg-linear-to-br from-white via-[#d6d6d6] to-[#8f8f8f] ${sizeClass[variant]} ${
        isClickable
          ? 'cursor-pointer transition-transform hover:scale-[1.02]'
          : ''
      } ${className}`.trim()}
      {...rest}
    >
      {thumbnail && (
        <div className="absolute inset-0 flex items-center justify-center">
          {thumbnail}
        </div>
      )}

      {label && (
        <span className="absolute left-32 top-[17.3rem] rounded-[22.2rem] bg-orange-500 px-12 py-8 text-body2 text-white">
          {label}
        </span>
      )}

      <div
        className={`relative z-10 mt-auto flex flex-col ${
          isDash ? 'gap-4 px-[2.2rem] pb-[2.2rem]' : 'gap-8 p-32'
        }`}
      >
        <h3
          className={`${isDash ? 'text-head3' : 'text-head2 font-extrabold'} text-white`}
        >
          {title}
        </h3>
        {description && (
          <p className={`${isDash ? 'truncate' : ''} text-body2 text-white`}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
