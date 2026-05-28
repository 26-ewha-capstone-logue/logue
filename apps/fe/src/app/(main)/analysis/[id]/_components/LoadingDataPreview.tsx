'use client';

import Image from 'next/image';
import loadingSpinner from '@/assets/lottie/loading_spinner.gif';

export type LoadingDataPreviewProps = {
  message?: string;
  showSpinner?: boolean;
  tone?: 'default' | 'error';
};

export default function LoadingDataPreview({
  message = 'CSV 데이터를 분석 중이에요',
  showSpinner = true,
  tone = 'default',
}: LoadingDataPreviewProps) {
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
            tone === 'error' ? 'text-error-500' : 'text-gray-700'
          }`}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
