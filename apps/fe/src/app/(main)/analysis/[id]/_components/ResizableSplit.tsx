'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg';

export type ResizableSplitProps = {
  left: ReactNode;
  right: ReactNode;
  /** 우측 영역 최소 width (rem) — 채팅창 최소 크기 보장 */
  minRightRem?: number;
  /** 좌측 영역 최소 width (rem) */
  minLeftRem?: number;
  /** 초기 우측 영역 width (rem). 미지정 시 컨테이너의 50% */
  initialRightRem?: number;
};

// 1rem = 10px (globals.css 의 base font-size 설정과 동일)
const REM = 10;

export default function ResizableSplit({
  left,
  right,
  minRightRem = 41.8,
  minLeftRem = 32,
  initialRightRem,
}: ResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rightRem, setRightRem] = useState<number | null>(
    initialRightRem ?? null,
  );
  const [isDragging, setIsDragging] = useState(false);

  // 마운트 후 컨테이너 width 기반으로 초기 width 계산
  useEffect(() => {
    if (rightRem !== null) return;
    const el = containerRef.current;
    if (!el) return;
    const totalRem = el.getBoundingClientRect().width / REM;
    // 기본값: 우측 영역 = 최소값 + 4rem 여유 또는 컨테이너 절반 중 큰 값
    const half = totalRem / 2;
    setRightRem(Math.max(minRightRem, Math.min(half, 56)));
  }, [rightRem, minRightRem]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // 컨테이너 우측 끝부터 마우스 X까지 거리 = 우측 영역 width
      const rightPx = rect.right - e.clientX;
      const totalRem = rect.width / REM;
      const nextRightRem = Math.min(
        Math.max(rightPx / REM, minRightRem),
        totalRem - minLeftRem,
      );
      setRightRem(nextRightRem);
    };
    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // 드래그 중 텍스트 선택 방지
    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [isDragging, minRightRem, minLeftRem]);

  return (
    <div ref={containerRef} className="relative flex flex-1 overflow-hidden">
      {/* 좌측 패널 (남는 공간 차지) */}
      <div className="flex flex-1 overflow-hidden bg-white">{left}</div>

      {/* 드래그 핸들 (히트 영역 1.2rem, 가운데 pill + 우측 화살표) */}
      <div
        role="separator"
        aria-orientation="vertical"
        onMouseDown={handleMouseDown}
        className="group relative flex w-[1.6rem] shrink-0 cursor-ew-resize items-center justify-center bg-gray-200"
      >
        {/* 가운데 세로 pill 막대 */}
        <div
          className={`h-[4.8rem] w-[0.5rem] rounded-full bg-gray-500 transition-colors ${
            isDragging ? 'bg-orange-400' : 'group-hover:bg-gray-600'
          }`}
        />
        {/* > 화살표 (막대 우측) */}
        <ArrowRightIcon
          aria-hidden
          className="pointer-events-none absolute left-[calc(50%+0.6rem)] icon-12 text-gray-500"
        />
      </div>

      {/* 우측 패널 (고정 width, 최소값 보장) */}
      <div
        className="flex shrink-0 flex-col overflow-hidden bg-gray-200"
        style={{
          width: rightRem !== null ? `${rightRem}rem` : `${minRightRem}rem`,
          minWidth: `${minRightRem}rem`,
        }}
      >
        {right}
      </div>
    </div>
  );
}
