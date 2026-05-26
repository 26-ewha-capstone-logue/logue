'use client';

import { useMemo, useState } from 'react';
import { createCriteriaEditValues } from '../_adapters/normalizeCriteria';
import type {
  AnalysisFilterViewModel,
  CriteriaEditValues,
  CriteriaViewModel,
} from '../_models/analysisViewModels';
import { uniqueStrings as uniqueOptions } from '../_utils/stringList';
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

type StaticRow = { kind: 'static'; label: string; value: string };
type SingleRow = {
  kind: 'single';
  label: string;
  key: keyof Pick<
    CriteriaEditValues,
    | 'baseDateColumn'
    | 'standardPeriod'
    | 'comparePeriod'
    | 'sortBy'
    | 'sortDirection'
  >;
  options: string[];
};
type MultiRow = {
  kind: 'multi';
  label: string;
  key: 'groupBy';
  options: string[];
  maxSelect?: number;
  headerLabel: string;
};

type RowSpec = StaticRow | SingleRow | MultiRow;

const DEFAULT_PERIOD_OPTIONS = ['이번 주', '지난 주', '이번 달', '지난 달'];
const DEFAULT_SORT_DIRECTION_OPTIONS = ['ASC', 'DESC'];

function formatFilters(filters: AnalysisFilterViewModel[]) {
  if (filters.length === 0) return '없음';

  return filters
    .map((filter) => filter.label)
    .filter(Boolean)
    .join(', ');
}

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

  const rows = useMemo<RowSpec[]>(() => {
    const groupBy = values.groupBy.length > 0 ? values.groupBy : [''];

    return [
      {
        kind: 'static',
        label: '분석 방식',
        value: criteria.analysisType.label,
      },
      {
        kind: 'static',
        label: '지표',
        value: criteria.metric.label,
      },
      {
        kind: 'single',
        label: '날짜 기준',
        key: 'baseDateColumn',
        options: uniqueOptions([
          values.baseDateColumn,
          ...(baseDateColumnOptions ?? []),
        ]),
      },
      {
        kind: 'single',
        label: '분석 기간',
        key: 'standardPeriod',
        options: uniqueOptions([
          values.standardPeriod,
          ...DEFAULT_PERIOD_OPTIONS,
        ]),
      },
      {
        kind: 'single',
        label: '비교 기간',
        key: 'comparePeriod',
        options: uniqueOptions([
          values.comparePeriod,
          ...DEFAULT_PERIOD_OPTIONS,
        ]),
      },
      {
        kind: 'multi',
        label: '비교 기준',
        key: 'groupBy',
        options: uniqueOptions([...groupBy, ...(groupByOptions ?? [])]),
        maxSelect: 5,
        headerLabel: '여러 값 선택 가능',
      },
      {
        kind: 'single',
        label: '정렬 기준',
        key: 'sortBy',
        options: uniqueOptions([values.sortBy, ...(sortByOptions ?? [])]),
      },
      {
        kind: 'single',
        label: '정렬 순서',
        key: 'sortDirection',
        options: uniqueOptions([
          values.sortDirection,
          ...(sortDirectionOptions ?? DEFAULT_SORT_DIRECTION_OPTIONS),
        ]),
      },
      {
        kind: 'static',
        label: '조회 개수',
        value: values.limitNum == null ? '제한 없음' : `${values.limitNum}개`,
      },
      {
        kind: 'static',
        label: '적용 조건',
        value: formatFilters(values.filters),
      },
    ];
  }, [
    baseDateColumnOptions,
    criteria.analysisType.label,
    criteria.metric.label,
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
