'use client';

import Image from 'next/image';
import CancelIcon from '@/assets/icons/cancel.svg';
import loadingSpinner from '@/assets/lottie/loading_spinner.gif';

export type AnalyzingIndicatorProps = {
  /** 상단에 표시할 메시지 (기본: "Logue가 분석 중이에요") */
  message?: string;
  cancelDisabled?: boolean;
  onCancel?: () => void;
};

export default function AnalyzingIndicator({
  cancelDisabled = false,
  message = 'Logue가 분석 중이에요',
  onCancel,
}: AnalyzingIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex flex-col gap-16"
    >
      <div className="flex items-center justify-between gap-12">
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

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelDisabled}
            className="inline-flex items-center gap-4 rounded-20 border border-gray-300 bg-white px-12 py-6 text-body4 text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            <CancelIcon aria-hidden className="icon-16" />
            취소
          </button>
        )}
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
