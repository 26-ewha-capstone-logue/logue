'use client';

import { useState } from 'react';
import ArrowDownIcon from '@/assets/icons/arrow-down.svg';
import type { SummaryViewModel } from '../_models/analysisViewModels';
import AnalysisWarningList from './AnalysisWarningList';

export type AnalysisResultProps = {
  summary: SummaryViewModel;
  warningActions?: {
    editLabel?: string;
    continueLabel?: string;
    disabled?: boolean;
    onEdit?: () => void;
    onContinue?: () => void;
  };
};

export default function AnalysisResult({
  summary,
  warningActions,
}: AnalysisResultProps) {
  const [summaryOpen, setSummaryOpen] = useState(true);
  const hasWarnings = summary.warnings.length > 0;

  return (
    <div className="flex w-full flex-col gap-16 rounded-20 bg-white p-24 shadow-[0_0.2rem_1.2rem_rgba(0,0,0,0.06)]">
      <div className="flex flex-col gap-8">
        <p className="text-body2 text-gray-900">{summary.title}</p>
        <p className="text-body2 text-gray-900">
          <span className="text-orange-500">
            {summary.rowCount.toLocaleString()}행
          </span>
          , <span className="text-orange-500">{summary.columnCount}열</span>의
          데이터가 업로드되었어요.
          <br />
          {summary.emptyMessage ?? summary.summaryText}
        </p>
      </div>

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
                {summary.keyPoints.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-16 py-12 text-center text-gray-600"
                    >
                      {summary.emptyMessage ??
                        '표시할 데이터 요약 항목이 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  summary.keyPoints.map((item, index) => (
                    <tr
                      key={`${item.name}-${item.example}-${index}`}
                      className="border-b border-gray-200 last:border-b-0"
                    >
                      <td className="px-16 py-12 text-gray-900">{item.name}</td>
                      <td className="px-16 py-12 text-orange-500">
                        {item.example}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hasWarnings && (
        <div className="flex flex-col gap-8">
          <AnalysisWarningList
            warnings={summary.warnings}
            titleClassName="text-body4"
            listClassName="ml-20 list-disc text-body2 text-gray-900"
          />
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
