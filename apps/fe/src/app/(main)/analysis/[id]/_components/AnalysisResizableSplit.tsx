'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg';

export type AnalysisResizableSplitProps = {
  left: ReactNode;
  right: ReactNode;
  /** 우측 영역 최소 width (rem) — 채팅창 최소 크기 보장 */
  minRightRem?: number;
  /** 좌측 영역 최소 width (rem) */
  minLeftRem?: number;
  /** 초기 우측 영역 width (rem). 미지정 시 컨테이너의 50% */
  initialRightRem?: number;
  /** 우측 채팅 패널 접힘 상태 */
  rightCollapsed?: boolean;
  /** 우측 채팅 패널 접힘 상태 변경 */
  onRightCollapsedChange?: (collapsed: boolean) => void;
  /** 접혔을 때 우측 레일 width (rem) */
  collapsedRightRem?: number;
};

// 1rem = 10px (globals.css 의 base font-size 설정과 동일)
const REM = 10;

export default function AnalysisResizableSplit({
  left,
  right,
  minRightRem = 41.8,
  minLeftRem = 32,
  initialRightRem,
  rightCollapsed,
  onRightCollapsedChange,
  collapsedRightRem = 3.9,
}: AnalysisResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rightRem, setRightRem] = useState<number | null>(
    initialRightRem ?? null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isRightCollapsed = rightCollapsed ?? internalCollapsed;

  const setCollapsed = useCallback(
    (collapsed: boolean) => {
      onRightCollapsedChange?.(collapsed);
      if (rightCollapsed === undefined) {
        setInternalCollapsed(collapsed);
      }
    },
    [onRightCollapsedChange, rightCollapsed],
  );

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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (isRightCollapsed) return;
      setIsDragging(true);
    },
    [isRightCollapsed],
  );

  useEffect(() => {
    if (!isDragging || isRightCollapsed) return;

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
  }, [isDragging, isRightCollapsed, minRightRem, minLeftRem]);

  const displayRightRem = isRightCollapsed
    ? collapsedRightRem
    : (rightRem ?? minRightRem);

  return (
    <div ref={containerRef} className="relative flex flex-1 overflow-hidden">
      {/* 좌측 패널 (남는 공간 차지) */}
      <div className="flex flex-1 overflow-hidden bg-white">{left}</div>

      {/* 드래그 핸들 (히트 영역 1.2rem, 가운데 pill + 우측 화살표) */}
      <div
        role="separator"
        aria-orientation="vertical"
        onMouseDown={handleMouseDown}
        className={`group relative flex w-[1.6rem] shrink-0 items-center justify-center bg-gray-200 ${
          isRightCollapsed ? 'cursor-default' : 'cursor-ew-resize'
        }`}
      >
        {/* 가운데 세로 pill 막대 */}
        <div
          className={`h-[4.8rem] w-[0.5rem] rounded-full bg-gray-500 transition-colors ${
            isDragging ? 'bg-orange-400' : 'group-hover:bg-gray-600'
          }`}
        />
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setCollapsed(!isRightCollapsed)}
          aria-label={isRightCollapsed ? '채팅창 열기' : '채팅창 닫기'}
          className="absolute left-[calc(50%+0.1rem)] flex h-24 w-24 items-center justify-center rounded-8 text-gray-500 transition-colors hover:bg-gray-300 hover:text-gray-700"
        >
          <ArrowRightIcon
            aria-hidden
            className={`icon-12 transition-transform ${
              isRightCollapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* 우측 패널 (고정 width, 최소값 보장) */}
      <div
        className={`flex shrink-0 flex-col overflow-hidden bg-gray-200 transition-[width] duration-200 ${
          isRightCollapsed ? 'items-center justify-center' : ''
        }`}
        style={{
          width: `${displayRightRem}rem`,
          minWidth: `${isRightCollapsed ? collapsedRightRem : minRightRem}rem`,
        }}
      >
        {isRightCollapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="채팅창 열기"
            className="flex h-32 w-32 items-center justify-center rounded-8 text-gray-600 transition-colors hover:bg-gray-300 hover:text-gray-900"
          >
            <ArrowRightIcon aria-hidden className="icon-16 rotate-180" />
          </button>
        ) : (
          right
        )}
      </div>
    </div>
  );
}
