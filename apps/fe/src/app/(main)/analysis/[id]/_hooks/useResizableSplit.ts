'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from 'react';

type UseResizableSplitParams = {
  collapsedRightRem: number;
  initialRightRem?: number;
  minLeftRem: number;
  minRightRem: number;
  onRightCollapsedChange?: (collapsed: boolean) => void;
  rightCollapsed?: boolean;
};

const REM = 10;

export function useResizableSplit({
  collapsedRightRem,
  initialRightRem,
  minLeftRem,
  minRightRem,
  onRightCollapsedChange,
  rightCollapsed,
}: UseResizableSplitParams) {
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

  useEffect(() => {
    if (rightRem !== null) return;

    const el = containerRef.current;
    if (!el) return;

    const totalRem = el.getBoundingClientRect().width / REM;
    const half = totalRem / 2;
    setRightRem(Math.max(minRightRem, Math.min(half, 56)));
  }, [rightRem, minRightRem]);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      if (isRightCollapsed) return;
      setIsDragging(true);
    },
    [isRightCollapsed],
  );

  useEffect(() => {
    if (!isDragging || isRightCollapsed) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
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
  const minWidthRem = isRightCollapsed ? collapsedRightRem : minRightRem;

  return {
    containerRef,
    displayRightRem,
    handleMouseDown,
    isDragging,
    isRightCollapsed,
    minWidthRem,
    setCollapsed,
  };
}
