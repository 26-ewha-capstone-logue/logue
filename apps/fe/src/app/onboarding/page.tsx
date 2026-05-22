'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ArrowLeftIcon from '@/assets/icons/arrow-left.svg';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg';
import { Button, Stepper } from '@/components';

/**
 * 완료 버튼용 체크 아이콘.
 * success.svg 는 mask + #7CEF3D 색이 들어가 있어 SVGR `convertColors: currentColor`
 * 와 호환되지 않아(마스크 white/black 까지 currentColor 로 바뀌어 마스크가 무효화)
 * 안전하게 inline 으로 단순 체크 path 만 사용.
 */
function CheckIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10 L8.5 14 L16 6" />
    </svg>
  );
}

type StepKey = 1 | 2 | 3;

const STEPS = ['도메인 선택', '업무리스트', '사용 툴 선택'];

const DOMAIN_OPTIONS = [
  '마케팅',
  '제품',
  '운영',
  '영업',
  '고객관리',
  '재무',
  '인사',
  '전략 / 기획',
  '물류',
  '기타',
];

const TASK_OPTIONS = [
  '캠페인 성과 확인',
  '광고 채널 효율 비교',
  '유입 경로 분석',
  '전환율 분석',
  'ROAS/광고비 효율 확인',
];

const TOOL_OPTIONS = [
  'GA4',
  'Google Ads / Meta Ads Manager',
  'Amplitude',
  'Mixpanel',
  'Firebase Analytics',
];

const STEP_COPY: Record<StepKey, { title: string; description: string }> = {
  1: {
    title: 'Logue는 {사용자}님의\n업무 도메인이 궁금해요!',
    description:
      '업무 맥락에 맞는 질문 예시와 분석 기준을 설정하는 데 활용돼요.',
  },
  2: {
    title: '현재 가장 자주 확인하는\n업무를 선택해주세요.',
    description:
      '선택한 업무에 맞춰 자주 쓰는 분석 질문과 기준을 맞춰드릴게요.',
  },
  3: {
    title: '현재 사용 중인 데이터 분석\n툴을 전부 선택해주세요.',
    description:
      '선택한 업무에 맞춰 자주 쓰는 분석 질문과 기준을 맞춰드릴게요.',
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<StepKey>(1);

  // 1) 도메인 (단일 선택)
  const [domain, setDomain] = useState<string | null>(null);
  // 2) 업무 (단일 선택, 시안 라디오 버튼)
  const [task, setTask] = useState<string | null>(null);
  // 3) 사용 툴 (다중 선택, 체크박스)
  const [tools, setTools] = useState<Set<string>>(new Set());

  const canGoNext =
    (step === 1 && domain !== null) ||
    (step === 2 && task !== null) ||
    (step === 3 && tools.size > 0);

  const handlePrev = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep((s) => (s - 1) as StepKey);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((s) => (s + 1) as StepKey);
      return;
    }
    // step 3 → 완료
    // TODO: 온보딩 결과 저장 API 호출
    router.push('/analysis');
  };

  const toggleTool = (value: string) => {
    setTools((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const copy = STEP_COPY[step];

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-200 px-24 py-40">
      <div className="flex w-full max-w-[88rem] flex-col overflow-hidden rounded-20 bg-white shadow-[0_0.4rem_2.4rem_rgba(0,0,0,0.06)]">
        {/* 본문 (좌/우 패널) */}
        <div className="flex flex-1">
          {/* 좌측: 타이틀 + 스테퍼 */}
          <aside className="flex w-xl flex-col justify-between border-r border-gray-200 px-32 py-40">
            <div className="flex flex-col gap-12">
              <h2 className="whitespace-pre-line text-head2 font-bold text-orange-500">
                {copy.title}
              </h2>
              <p className="text-body4 text-gray-700">{copy.description}</p>
            </div>
            <Stepper steps={STEPS} currentStep={step} />
          </aside>

          {/* 우측: 동일한 헤더 카피 + 진행 막대 + 선택 영역 */}
          <section className="flex flex-1 flex-col gap-24 px-32 py-40">
            <div className="flex flex-col gap-12">
              <h3 className="whitespace-pre-line text-head3 font-bold text-gray-900">
                {copy.title}
              </h3>
              <p className="text-body4 text-gray-700">{copy.description}</p>
              <ProgressBar current={step} total={3} />
            </div>

            <div className="flex-1">
              {step === 1 && (
                <DomainGrid
                  options={DOMAIN_OPTIONS}
                  value={domain}
                  onChange={setDomain}
                />
              )}
              {step === 2 && (
                <RadioList
                  options={TASK_OPTIONS}
                  value={task}
                  onChange={setTask}
                />
              )}
              {step === 3 && (
                <CheckboxList
                  options={TOOL_OPTIONS}
                  values={tools}
                  onToggle={toggleTool}
                />
              )}
            </div>
          </section>
        </div>

        {/* 하단 액션 바 */}
        <div className="flex items-center justify-end gap-12 border-t border-gray-200 px-32 py-20">
          {step > 1 && (
            <Button
              variant="outlined"
              size="md"
              icon={<ArrowLeftIcon />}
              onClick={handlePrev}
            >
              이전
            </Button>
          )}
          {step < 3 ? (
            <Button
              variant="primary"
              size="md"
              icon={<ArrowRightIcon />}
              disabled={!canGoNext}
              onClick={handleNext}
            >
              다음
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              icon={<CheckIcon />}
              disabled={!canGoNext}
              onClick={handleNext}
            >
              완료
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

/** 상단 진행 막대 (3분할). 현재 단계까지 오렌지, 이후는 회색 */
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-8">
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < current;
        return (
          <span
            key={i}
            className={`h-4 flex-1 rounded-full transition-colors ${
              filled ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          />
        );
      })}
    </div>
  );
}

/** 도메인 선택: 2열 그리드 카드형 옵션 */
function DomainGrid({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-12">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-12 border px-16 py-12 text-body2 transition-colors ${
              active
                ? 'border-orange-500 bg-orange-100 text-orange-600'
                : 'border-gray-300 bg-white text-gray-800 hover:border-gray-400'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/** 업무 단일 선택: 라디오 버튼 리스트 */
function RadioList({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-12">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex items-center justify-between rounded-12 border px-16 py-12 text-left text-body2 transition-colors ${
              active
                ? 'border-orange-500 bg-orange-100 text-orange-600'
                : 'border-gray-300 bg-white text-gray-800 hover:border-gray-400'
            }`}
          >
            <span>{opt}</span>
            <span
              className={`relative inline-flex h-[1.8rem] w-[1.8rem] items-center justify-center rounded-full border-2 transition-colors ${
                active ? 'border-orange-500' : 'border-gray-400'
              }`}
            >
              {active && (
                <span className="absolute inline-block h-8 w-8 rounded-full bg-orange-500" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** 사용 툴 다중 선택: 체크박스 리스트 */
function CheckboxList({
  options,
  values,
  onToggle,
}: {
  options: string[];
  values: Set<string>;
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-12">
      {options.map((opt) => {
        const active = values.has(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`flex items-center justify-between rounded-12 border px-16 py-12 text-left text-body2 transition-colors ${
              active
                ? 'border-orange-500 bg-orange-100 text-orange-600'
                : 'border-gray-300 bg-white text-gray-800 hover:border-gray-400'
            }`}
          >
            <span>{opt}</span>
            <span
              className={`inline-flex h-[1.8rem] w-[1.8rem] items-center justify-center rounded-4 border-2 transition-colors ${
                active
                  ? 'border-orange-500 bg-orange-500'
                  : 'border-gray-400 bg-white'
              }`}
            >
              {active && (
                <svg
                  aria-hidden
                  viewBox="0 0 12 10"
                  className="h-[1rem] w-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 5 4.5 8.5 11 1.5" />
                </svg>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
