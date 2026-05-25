'use client';

import { useMemo, useState } from 'react';
import AlertIcon from '@/assets/icons/alert.svg';
import { createCriteriaEditValues } from '../_adapters/normalizeCriteria';
import type {
  AnalysisFilterViewModel,
  CriteriaEditValues,
  CriteriaViewModel,
} from '../_models/analysisViewModels';
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
const DEFAULT_SORT_DIRECTION_OPTIONS = ['ASC', 'DESC', 'asc', 'desc'];

function compactStrings(values: Array<string | null | undefined>) {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

function uniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(new Set(compactStrings(values)));
}

function formatFilters(filters: AnalysisFilterViewModel[]) {
  if (filters.length === 0) return '없음';

  return filters
    .map((filter) => filter.label)
    .filter(Boolean)
    .join(', ');
}

function DataWarningBlock({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="inline-flex items-center gap-4 text-body2 font-semibold text-orange-500">
        <AlertIcon aria-hidden className="icon-16 text-orange-500" />
        <span>데이터 경고</span>
      </div>
      <ul className="ml-20 flex list-disc flex-col gap-8 text-body2 text-gray-900">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  );
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

  const warningTexts = useMemo(
    () => criteria.warnings.map((warning) => warning.message),
    [criteria.warnings],
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
    <div className="flex w-full flex-col gap-16 rounded-20 bg-white p-24 shadow-[0_0.2rem_1.2rem_rgba(0,0,0,0.06)]">
      <div className="flex flex-col gap-4">
        <p className="text-body3 font-semibold text-gray-900">
          질문 분석이 완료되었어요.
        </p>
        <p className="text-body2 text-gray-900">
          아래 분석 기준으로 검증을 진행해도 될까요?
        </p>
      </div>

      <div className="overflow-hidden rounded-12 border border-gray-300">
        <table className="w-full border-collapse text-body2">
          <thead>
            <tr>
              <th className="w-[14rem] border-b border-gray-300 px-16 py-12 text-left font-semibold text-gray-900">
                항목
              </th>
              <th className="border-b border-gray-300 px-16 py-12 text-left font-semibold text-gray-900">
                필드명
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className="border-b border-gray-200 last:border-b-0"
              >
                <td className="px-16 py-12 text-gray-700">{row.label}</td>
                <td className="px-16 py-12 text-gray-900">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DataWarningBlock warnings={warningTexts} />

      {mode === 'normal' ? (
        <div className="flex justify-end gap-8">
          <button
            type="button"
            onClick={handleEdit}
            disabled={isSubmitting}
            className="rounded-20 bg-gray-300 px-16 py-8 text-body2 text-gray-700 transition-colors hover:bg-gray-400 disabled:cursor-not-allowed disabled:text-gray-500"
          >
            수정하기
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={isSubmitting}
            className="rounded-20 bg-orange-500 px-16 py-8 text-body2 text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-600"
          >
            {isSubmitting ? '확정 중' : '이 기준으로 계속 할게요'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          <div className="flex justify-end gap-8">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
              className="rounded-20 bg-gray-300 px-16 py-8 text-body2 text-gray-700 transition-colors hover:bg-gray-400 disabled:cursor-not-allowed disabled:text-gray-500"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={isSubmitting}
              className="rounded-20 bg-orange-500 px-16 py-8 text-body2 text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-600"
            >
              {isSubmitting ? '확정 중' : '이 기준으로 계속 할게요'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
