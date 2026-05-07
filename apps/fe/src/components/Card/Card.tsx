import { type HTMLAttributes, type ReactNode } from 'react';

export type CardProps = {
  /** 분야명 (굵은 제목) */
  title: string;
  /** 세부 설명 (1줄) */
  description?: string;
  /** 카드 상단에 표시할 이미지/콘텐츠 */
  thumbnail?: ReactNode;
  /** 클릭 콜백 */
  onClick?: () => void;
} & Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'>;

export default function Card({
  title,
  description,
  thumbnail,
  onClick,
  className = '',
  ...rest
}: CardProps) {
  const isClickable = !!onClick;

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
      className={`group flex w-full flex-col overflow-hidden rounded-20 bg-linear-to-br from-white via-[#f0f0f0] to-[#c8c8c8] shadow-[0_0.4rem_2rem_rgba(0,0,0,0.08)] ${isClickable ? 'cursor-pointer transition-transform hover:scale-[1.02]' : ''} ${className}`.trim()}
      {...rest}
    >
      {/* 썸네일 영역 */}
      <div className="flex h-[20rem] w-full items-center justify-center">
        {thumbnail}
      </div>

      {/* 텍스트 영역 */}
      <div className="flex flex-col gap-4 px-24 pb-24 pt-8">
        <h3 className="text-head2 text-white">{title}</h3>
        {description && (
          <p className="truncate text-body2 text-white/80">{description}</p>
        )}
      </div>
    </div>
  );
}
