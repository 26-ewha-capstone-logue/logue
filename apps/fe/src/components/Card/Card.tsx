import { type HTMLAttributes, type ReactNode } from 'react';

export type CardProps = {
  /** 분야명 (굵은 제목) */
  title: string;
  /** 세부 설명 (1줄) */
  description?: string;
  /** 카드 배경에 깔리는 일러스트/아이콘 (absolute fill) */
  thumbnail?: ReactNode;
  /** 클릭 콜백 */
  onClick?: () => void;
} & Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'>;

// 디자인 시안:
// background: linear-gradient(0deg,
//   rgba(0,0,0,0.40) 6.82%,
//   rgba(128,128,128,0.20) 51.23%,
//   rgba(255,255,255,0.00) 88.38%), #FFF;
const CARD_BACKGROUND =
  'linear-gradient(0deg, rgba(0, 0, 0, 0.40) 6.82%, rgba(128, 128, 128, 0.20) 51.23%, rgba(255, 255, 255, 0.00) 88.38%), #FFF';

const CARD_GRADIENT_OVERLAY =
  'linear-gradient(0deg, rgba(0, 0, 0, 0.40) 6.82%, rgba(128, 128, 128, 0.20) 51.23%, rgba(255, 255, 255, 0.00) 88.38%)';

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
      // thumbnail 이 없을 때는 시안 그대로 multi-background 적용
      // thumbnail 이 있을 때는 흰색 베이스만 두고 일러스트 → 그라데이션 순서로 레이어링
      style={{ background: thumbnail ? '#FFF' : CARD_BACKGROUND }}
      className={`relative h-[18.5rem] w-full overflow-hidden rounded-[2.4rem] ${isClickable ? 'cursor-pointer transition-transform hover:scale-[1.02]' : ''} ${className}`.trim()}
      {...rest}
    >
      {thumbnail && (
        <>
          {/* 일러스트 layer */}
          <div className="pointer-events-none absolute inset-0 z-0">
            {thumbnail}
          </div>
          {/* 그라데이션 오버레이 layer */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10"
            style={{ background: CARD_GRADIENT_OVERLAY }}
          />
        </>
      )}

      {/* 텍스트 layer (좌하단)
       * 시안의 padding-right 15.4rem 은 일러스트 영역을 위한 여백이지만,
       * 텍스트에 그대로 적용하면 가용 폭이 좁아 잘리므로
       * 텍스트 div 자체는 좌우 동일 패딩으로 두고 일러스트(thumbnail)는 별도 layer 로 처리한다.
       */}
      <div className="relative z-20 flex h-full flex-col items-start justify-end gap-2 px-[2.2rem] pt-[11.2rem] pb-[2.2rem]">
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
