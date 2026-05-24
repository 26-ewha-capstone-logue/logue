'use client';

import { useState } from 'react';
import ArrowDownIcon from '@/assets/icons/arrow-down.svg';
import AlertIcon from '@/assets/icons/alert.svg';

export type ColumnCandidate = {
  name: string;
  example: string;
};

export type AnalysisResultProps = {
  rowCount: number;
  columnCount: number;
  /** 본문 보조 텍스트 */
  description?: string;
  /** 데이터 요약 표 행들 */
  candidates?: ColumnCandidate[];
  /** 데이터 경고 메시지들 */
  warnings?: string[];
  /** 데이터 경고가 있을 때 노출할 액션 */
  warningActions?: {
    editLabel?: string;
    continueLabel?: string;
    disabled?: boolean;
    onEdit?: () => void;
    onContinue?: () => void;
  };
};

const DEFAULT_CANDIDATES: ColumnCandidate[] = Array.from({ length: 9 }, () => ({
  name: '날짜 기준',
  example: 'signup_date, created_at',
}));

export default function AnalysisResult({
  rowCount,
  columnCount,
  description = '분석에 필요한 주요 컬럼 후보를 아래처럼 찾았어요.',
  candidates = DEFAULT_CANDIDATES,
  warnings,
  warningActions,
}: AnalysisResultProps) {
  const [summaryOpen, setSummaryOpen] = useState(true);
  const hasWarnings = Boolean(warnings?.length);

  return (
    <div className="flex w-full flex-col gap-16 rounded-20 bg-white p-24 shadow-[0_0.2rem_1.2rem_rgba(0,0,0,0.06)]">
      {/* 헤더 텍스트 */}
      <div className="flex flex-col gap-8">
        <p className="text-body2 text-gray-900">데이터를 확인했어요.</p>
        <p className="text-body2 text-gray-900">
          총{' '}
          <span className="text-orange-500">{rowCount.toLocaleString()}행</span>
          , <span className="text-orange-500">{columnCount}열</span>의 데이터가
          업로드되었어요.
          <br />
          {description}
        </p>
      </div>

      {/* 데이터 요약 (collapsible) */}
      <div className="flex flex-col gap-8">
        <button
          type="button"
          onClick={() => setSummaryOpen((v) => !v)}
          className="inline-flex items-center gap-4 self-start text-body4 text-gray-700"
          aria-expanded={summaryOpen}
        >
          <ArrowDownIcon
            aria-hidden
            className={`icon-16 text-gray-700 transition-transform ${
              summaryOpen ? 'rotate-180' : ''
            }`}
          />
          <span>데이터 요약</span>
        </button>

        {summaryOpen && (
          <div className="overflow-hidden rounded-12 border border-gray-300">
            <table className="w-full border-collapse text-body4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="w-[14rem] border-b border-gray-300 px-16 py-12 text-left font-semibold text-gray-900">
                    Name
                  </th>
                  <th className="border-b border-gray-300 px-16 py-12 text-left font-semibold text-gray-900">
                    예시
                  </th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-200 last:border-b-0"
                  >
                    <td className="px-16 py-12 text-gray-900">{c.name}</td>
                    <td className="px-16 py-12 text-orange-500">{c.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 데이터 경고 */}
      {hasWarnings && (
        <div className="flex flex-col gap-8">
          <div className="inline-flex items-center gap-4 text-body4 text-orange-500">
            <AlertIcon aria-hidden className="icon-16 text-orange-500" />
            <span>데이터 경고</span>
          </div>
          <ul className="ml-20 list-disc text-body2 text-gray-900">
            {warnings?.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          {warningActions && (
            <div className="mt-8 flex justify-end gap-8">
              <button
                type="button"
                onClick={warningActions.onEdit}
                disabled={warningActions.disabled}
                className="rounded-20 bg-gray-300 px-16 py-8 text-body2 text-gray-700 transition-colors hover:bg-gray-400 disabled:cursor-not-allowed disabled:text-gray-500"
              >
                {warningActions.editLabel ?? '수정하기'}
              </button>
              <button
                type="button"
                onClick={warningActions.onContinue}
                disabled={warningActions.disabled}
                className="rounded-20 bg-orange-500 px-16 py-8 text-body2 text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-600"
              >
                {warningActions.continueLabel ?? '이 기준으로 계속 할게요'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
