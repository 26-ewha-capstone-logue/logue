'use client';

import { useRef, type ReactNode } from 'react';
import ArrowLeftIcon from '@/assets/icons/arrow-left.svg';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg';

export type IntroCarouselProps = {
  /** 섹션 제목 (강조 텍스트는 <strong> 등으로 직접 포함) */
  title: ReactNode;
  /** 제목 위 작은 부가 문구 */
  description?: ReactNode;
  /** 좌우로 스크롤할 카드 리스트 */
  cards: ReactNode[];
  /** 화살표 클릭 시 한 번에 움직일 거리(px) */
  scrollAmount?: number;
};

/**
 * 가로 스와이프 캐러셀.
 * - 데스크탑: 좌/우 화살표 버튼으로 일정량 스크롤
 * - 모바일: 터치 스와이프(브라우저 기본 가로 스크롤)
 */
export default function IntroCarousel({
  title,
  description,
  cards,
  scrollAmount = 480,
}: IntroCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section className="flex flex-col gap-20">
      {/* 헤더: 텍스트 + 좌우 화살표 */}
      <div className="flex items-end justify-between gap-16 px-[8rem]">
        <div className="flex flex-col gap-4">
          {description && (
            <p className="text-body2 text-gray-700">{description}</p>
          )}
          <h2 className="text-head3 font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-8">
          <button
            type="button"
            onClick={() => scrollBy(-scrollAmount)}
            aria-label="이전"
            className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300"
          >
            <ArrowLeftIcon aria-hidden className="icon-16 text-gray-800" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(scrollAmount)}
            aria-label="다음"
            className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300"
          >
            <ArrowRightIcon aria-hidden className="icon-16 text-gray-800" />
          </button>
        </div>
      </div>

      {/* 가로 스크롤 영역 — 좌우는 페이지 가장자리까지 확장 */}
      <div
        ref={scrollRef}
        className="scrollbar-hide flex scroll-smooth gap-16 overflow-x-auto px-[8rem]"
      >
        {cards.map((card, i) => (
          <div key={i} className="shrink-0">
            {card}
          </div>
        ))}
      </div>
    </section>
  );
}
