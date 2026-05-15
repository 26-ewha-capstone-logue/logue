'use client';

import { useState } from 'react';
import AlertIcon from '@/assets/icons/alert.svg';
import CriterionSelect from './CriterionSelect';

export type QuestionAnalysisResultProps = {
  /** 수정하기 클릭 시 노출할 데이터 경고 목록 */
  warnings?: string[];
  /** 카드 외부 콜백 — 수정하기 클릭 */
  onEdit?: () => void;
  /** 카드 외부 콜백 — 이 기준으로 계속 클릭 */
  onContinue?: (values: EditableValues) => void;
};

/** edit 모드에서 사용자가 변경 가능한 값들 */
export type EditableValues = {
  dateBase: string;
  analysisRange: string;
  compareRange: string;
  compareBase: string;
  sortOrder: string;
  applyConditions: string[];
};

type StaticRow = { kind: 'static'; label: string; value: string };
type SingleRow = {
  kind: 'single';
  label: string;
  key: keyof Omit<EditableValues, 'applyConditions'>;
  options: string[];
};
type MultiRow = {
  kind: 'multi';
  label: string;
  key: 'applyConditions';
  options: string[];
  maxSelect: number;
  headerLabel: string;
};

type RowSpec = StaticRow | SingleRow | MultiRow;

// 표 row 정의 — 사용자가 수정 가능한 항목만 single/multi 로 둠
const ROWS: RowSpec[] = [
  { kind: 'static', label: '분석 방식', value: '비교 분석' },
  { kind: 'static', label: '지표', value: '가입 전환율' },
  {
    kind: 'single',
    label: '날짜 기준',
    key: 'dateBase',
    options: ['가입일', '결제일', '방문일'],
  },
  {
    kind: 'single',
    label: '분석 기간',
    key: 'analysisRange',
    options: ['이번 주', '지난 주', '이번 달', '지난 달'],
  },
  {
    kind: 'single',
    label: '비교 기간',
    key: 'compareRange',
    options: ['지난 주', '2주 전', '지난 달'],
  },
  {
    kind: 'single',
    label: '비교 기준',
    key: 'compareBase',
    options: ['채널, 디바이스', '채널', '디바이스', '연령'],
  },
  { kind: 'static', label: '정렬 기준', value: '전환율 변화량' },
  {
    kind: 'single',
    label: '정렬 순서',
    key: 'sortOrder',
    options: ['낮은 순', '높은 순'],
  },
  {
    kind: 'multi',
    label: '적용 조건',
    key: 'applyConditions',
    options: [
      'internal_text 제외',
      'test 계정 제외',
      '활성 사용자만',
      '특정 채널 제외',
    ],
    maxSelect: 2,
    headerLabel: '최대 2개 선택',
  },
];

const INITIAL_VALUES: EditableValues = {
  dateBase: '가입일',
  analysisRange: '이번 주',
  compareRange: '지난 주',
  compareBase: '채널, 디바이스',
  sortOrder: '낮은 순',
  applyConditions: ['internal_text 제외'],
};

const DEFAULT_WARNINGS = [
  '날짜 기준을 하나로 정할 수 없어요. 어떤 날짜를 기준으로 볼지 선택해 주세요.',
  '현재 질문에 필요한 항목이 이 데이터에 없어요. 없는 항목은 다른 기준으로 바꿔서 계속할 수 있어요.',
  '분석에 필요한 값이 일부 비어 있어요. 결과가 달라질 수 있어서, 해당 항목을 확인하고 계속할지 선택해 주세요. (칼럼명1, 칼럼명2)',
];

type Mode = 'normal' | 'edit';

export default function QuestionAnalysisResult({
  warnings = DEFAULT_WARNINGS,
  onEdit,
  onContinue,
}: QuestionAnalysisResultProps) {
  const [mode, setMode] = useState<Mode>('normal');
  const [values, setValues] = useState<EditableValues>(INITIAL_VALUES);

  const handleEdit = () => {
    setMode('edit');
    onEdit?.();
  };

  const handleCancelEdit = () => {
    setMode('normal');
    setValues(INITIAL_VALUES);
  };

  const handleContinue = () => {
    onContinue?.(values);
  };

  // 단일 값 표시용 (normal 모드 셀)
  const renderStaticValue = (row: RowSpec) => {
    if (row.kind === 'static') return row.value;
    if (row.kind === 'multi') return values.applyConditions.join(', ');
    return values[row.key];
  };

  return (
    <div className="flex w-full flex-col gap-16 rounded-20 bg-white p-24 shadow-[0_0.2rem_1.2rem_rgba(0,0,0,0.06)]">
      {/* 헤더 */}
      <div className="flex flex-col gap-4">
        <p className="text-body3 font-semibold text-gray-900">
          질문 분석이 완료되었어요.
        </p>
        <p className="text-body2 text-gray-900">
          아래 분석 기준으로 검증을 진행해도 될까요?
        </p>
      </div>

      {/* 분석 기준 표 */}
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
            {ROWS.map((row) => (
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
                        setValues((v) => ({ ...v, [row.key]: next }))
                      }
                    />
                  ) : (
                    <CriterionSelect
                      multi
                      options={row.options}
                      values={values.applyConditions}
                      maxSelect={row.maxSelect}
                      headerLabel={row.headerLabel}
                      onChange={(next) =>
                        setValues((v) => ({ ...v, applyConditions: next }))
                      }
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mode === 'normal' ? (
        <div className="flex justify-end gap-8">
          <button
            type="button"
            onClick={handleEdit}
            className="rounded-20 bg-gray-300 px-16 py-8 text-body2 text-gray-700 transition-colors hover:bg-gray-400"
          >
            수정하기
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="rounded-20 bg-orange-500 px-16 py-8 text-body2 text-white transition-colors hover:bg-orange-600"
          >
            이 기준으로 계속 할게요
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          <div className="flex flex-col gap-8">
            <div className="inline-flex items-center gap-4 text-body2 font-semibold text-orange-500">
              <AlertIcon aria-hidden className="icon-16 text-orange-500" />
              <span>데이터 경고</span>
            </div>
            <ul className="ml-20 flex list-disc flex-col gap-8 text-body2 text-gray-900">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
          {/* edit 모드에서도 진행 경로 유지: 취소 / 계속 */}
          <div className="flex justify-end gap-8">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-20 bg-gray-300 px-16 py-8 text-body2 text-gray-700 transition-colors hover:bg-gray-400"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="rounded-20 bg-orange-500 px-16 py-8 text-body2 text-white transition-colors hover:bg-orange-600"
            >
              이 기준으로 계속 할게요
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
