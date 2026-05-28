'use client';

import { useMemo, useState } from 'react';
import { createCriteriaEditValues } from '../_adapters/normalizeCriteria';
import {
  createCriteriaEditRows,
  type CriteriaEditRowSpec,
} from '../_config/criteriaFieldConfig';
import type {
  CriteriaEditValues,
  CriteriaViewModel,
} from '../_models/analysisViewModels';
import AnalysisActionButtons from './AnalysisActionButtons';
import AnalysisCard from './AnalysisCard';
import {
  AnalysisTable,
  AnalysisTableCell,
  AnalysisTableHeaderCell,
  AnalysisTableRow,
} from './AnalysisTable';
import AnalysisWarningList from './AnalysisWarningList';
import CriterionSelect from './CriterionSelect';

type Mode = 'normal' | 'edit';

export type QuestionAnalysisResultProps = {
  criteria: CriteriaViewModel;
  baseDateColumnOptions?: string[];
  groupByOptions?: string[];
  sortByOptions?: string[];
  sortDirectionOptions?: string[];
  initialMode?: Mode;
  isSubmitting?: boolean;
  onEdit?: () => void;
  onContinue?: (values: CriteriaEditValues) => void;
};

export default function QuestionAnalysisResult({
  criteria,
  baseDateColumnOptions,
  groupByOptions,
  sortByOptions,
  sortDirectionOptions,
  initialMode = 'normal',
  isSubmitting = false,
  onEdit,
  onContinue,
}: QuestionAnalysisResultProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [values, setValues] = useState<CriteriaEditValues>(() =>
    createCriteriaEditValues(criteria),
  );

  const rows = useMemo<CriteriaEditRowSpec[]>(() => {
    return createCriteriaEditRows({
      baseDateColumnOptions,
      criteria,
      groupByOptions,
      sortByOptions,
      sortDirectionOptions,
      values,
    });
  }, [
    baseDateColumnOptions,
    criteria,
    groupByOptions,
    sortByOptions,
    sortDirectionOptions,
    values,
  ]);

  const handleEdit = () => {
    setMode('edit');
    onEdit?.();
  };

  const handleCancelEdit = () => {
    setMode('normal');
    setValues(createCriteriaEditValues(criteria));
  };

  const handleContinue = () => {
    onContinue?.(values);
  };

  const renderStaticValue = (row: RowSpec) => {
    if (row.kind === 'static') return row.value || '-';
    if (row.kind === 'multi') return values.groupBy.join(', ') || '-';
    return values[row.key] || '-';
  };

  return (
    <AnalysisCard>
      <div className="flex flex-col gap-4">
        <p className="text-body3 font-semibold text-gray-900">
          질문 분석이 완료되었어요.
        </p>
        <p className="text-body2 text-gray-900">
          아래 분석 기준으로 검증을 진행해도 될까요?
        </p>
      </div>

      <AnalysisTable>
        <thead>
          <tr>
            <AnalysisTableHeaderCell className="w-[14rem]">
              항목
            </AnalysisTableHeaderCell>
            <AnalysisTableHeaderCell>필드명</AnalysisTableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <AnalysisTableRow key={row.label}>
              <AnalysisTableCell className="text-gray-700">
                {row.label}
              </AnalysisTableCell>
              <AnalysisTableCell className="text-gray-900">
                {mode === 'normal' || row.kind === 'static' ? (
                  renderStaticValue(row)
                ) : row.kind === 'single' ? (
                  <CriterionSelect
                    options={row.options}
                    value={values[row.key]}
                    onChange={(next) =>
                      setValues((prev) => ({ ...prev, [row.key]: next }))
                    }
                  />
                ) : (
                  <CriterionSelect
                    multi
                    options={row.options}
                    values={values.groupBy}
                    maxSelect={row.maxSelect}
                    headerLabel={row.headerLabel}
                    onChange={(next) =>
                      setValues((prev) => ({ ...prev, groupBy: next }))
                    }
                  />
                )}
              </AnalysisTableCell>
            </AnalysisTableRow>
          ))}
        </tbody>
      </AnalysisTable>

      <AnalysisWarningList warnings={criteria.warnings} />

      {mode === 'normal' ? (
        <AnalysisActionButtons
          disabled={isSubmitting}
          continueLabel={isSubmitting ? '확정 중' : '이 기준으로 계속 할게요'}
          onEdit={handleEdit}
          onContinue={handleContinue}
        />
      ) : (
        <div className="flex flex-col gap-16">
          <AnalysisActionButtons
            editLabel="취소"
            disabled={isSubmitting}
            continueLabel={isSubmitting ? '확정 중' : '이 기준으로 계속 할게요'}
            onEdit={handleCancelEdit}
            onContinue={handleContinue}
          />
        </div>
      )}
    </AnalysisCard>
  );
}
