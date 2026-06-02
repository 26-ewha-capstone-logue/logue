'use client';

import { useState } from 'react';
import ArrowDownIcon from '@/assets/icons/arrow-down.svg';
import type { SummaryViewModel } from '@/features/analysis/models/analysisViewModels';
import AnalysisActionButtons from './AnalysisActionButtons';
import AnalysisCard from './AnalysisCard';
import AnalysisKeyValueTable from './AnalysisKeyValueTable';
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
  const summaryRows = summary.keyPoints.map((item, index) => ({
    key: `${item.name}-${item.example}-${index}`,
    cells: [item.name, item.example] as const,
    cellClassNames: ['text-gray-900', 'text-orange-500'] as const,
  }));

  return (
    <AnalysisCard>
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
          <AnalysisKeyValueTable
            headers={['Name', '예시']}
            headerRowClassName="bg-gray-100"
            rows={summaryRows}
            tableClassName="text-body4"
            emptyContent={
              summary.emptyMessage ?? '표시할 데이터 요약 항목이 없습니다.'
            }
          />
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
            <AnalysisActionButtons
              className="mt-8"
              editLabel={warningActions.editLabel}
              continueLabel={warningActions.continueLabel}
              disabled={warningActions.disabled}
              onEdit={warningActions.onEdit}
              onContinue={warningActions.onContinue}
            />
          )}
        </div>
      )}
    </AnalysisCard>
  );
}
