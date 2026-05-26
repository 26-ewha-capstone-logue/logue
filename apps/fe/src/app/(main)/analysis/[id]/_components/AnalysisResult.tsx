'use client';

import { useState } from 'react';
import ArrowDownIcon from '@/assets/icons/arrow-down.svg';
import type { SummaryViewModel } from '../_models/analysisViewModels';
import AnalysisActionButtons from './AnalysisActionButtons';
import AnalysisCard from './AnalysisCard';
import {
  AnalysisTable,
  AnalysisTableCell,
  AnalysisTableHeaderCell,
  AnalysisTableRow,
} from './AnalysisTable';
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
          <AnalysisTable tableClassName="text-body4">
            <thead>
              <tr className="bg-gray-100">
                <AnalysisTableHeaderCell className="w-[14rem]">
                  Name
                </AnalysisTableHeaderCell>
                <AnalysisTableHeaderCell>예시</AnalysisTableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {summary.keyPoints.length === 0 ? (
                <tr>
                  <AnalysisTableCell
                    colSpan={2}
                    className="text-center text-gray-600"
                  >
                    {summary.emptyMessage ??
                      '표시할 데이터 요약 항목이 없습니다.'}
                  </AnalysisTableCell>
                </tr>
              ) : (
                summary.keyPoints.map((item, index) => (
                  <AnalysisTableRow
                    key={`${item.name}-${item.example}-${index}`}
                  >
                    <AnalysisTableCell className="text-gray-900">
                      {item.name}
                    </AnalysisTableCell>
                    <AnalysisTableCell className="text-orange-500">
                      {item.example}
                    </AnalysisTableCell>
                  </AnalysisTableRow>
                ))
              )}
            </tbody>
          </AnalysisTable>
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
