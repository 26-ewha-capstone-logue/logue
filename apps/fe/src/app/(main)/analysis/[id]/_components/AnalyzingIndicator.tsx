'use client';

import Image from 'next/image';
import loadingSpinner from '@/assets/lottie/loading_spinner.gif';

export type AnalyzingIndicatorProps = {
  /** 상단에 표시할 메시지 (기본: "Logue가 분석 중이에요") */
  message?: string;
};

export default function AnalyzingIndicator({
  message = 'Logue가 분석 중이에요',
}: AnalyzingIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col gap-16"
    >
      <div className="flex items-center gap-12">
        <Image
          src={loadingSpinner}
          alt=""
          aria-hidden
          unoptimized
          className="h-24 w-24"
        />
        <span className="text-body2 text-gray-900">{message}</span>
      </div>

      {/* 스켈레톤 라인 3줄 */}
      <div className="flex flex-col gap-8" aria-hidden>
        <div className="h-12 w-[40rem] animate-pulse rounded-4 bg-gray-300" />
        <div className="h-12 w-[36rem] animate-pulse rounded-4 bg-gray-300" />
        <div className="h-12 w-[28rem] animate-pulse rounded-4 bg-gray-300" />
      </div>
    </div>
  );
}
