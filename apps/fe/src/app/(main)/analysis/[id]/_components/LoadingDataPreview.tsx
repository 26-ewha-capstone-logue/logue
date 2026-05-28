'use client';

import Image from 'next/image';
import loadingSpinner from '@/assets/lottie/loading_spinner.gif';

type LoadingDataPreviewVariant = 'default' | 'loading' | 'error' | 'empty';

export type LoadingDataPreviewProps = {
  message?: string;
  variant?: LoadingDataPreviewVariant;
};

const DEFAULT_MESSAGES: Record<LoadingDataPreviewVariant, string> = {
  default: 'CSV 데이터를 분석 중이에요',
  empty: '표시할 CSV 미리보기 데이터가 없습니다.',
  error: 'CSV 미리보기를 불러오지 못했어요.',
  loading: 'CSV 미리보기를 불러오는 중이에요',
};

export default function LoadingDataPreview({
  message,
  variant = 'default',
}: LoadingDataPreviewProps) {
  const showSpinner = variant === 'default' || variant === 'loading';

  return (
    <div className="flex h-full w-full items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-16">
        {showSpinner && (
          <Image
            src={loadingSpinner}
            alt=""
            aria-hidden
            unoptimized
            className="h-40 w-40"
          />
        )}
        <p
          className={`text-body2 ${
            variant === 'error' ? 'text-error-500' : 'text-gray-700'
          }`}
        >
          {message ?? DEFAULT_MESSAGES[variant]}
        </p>
      </div>
    </div>
  );
}
