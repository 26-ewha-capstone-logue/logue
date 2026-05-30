'use client';

import { useRouter } from 'next/navigation';
import ArrowLeftIcon from '@/assets/icons/arrow-left.svg';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg';
import { Button, Stepper } from '@/components';
import {
  DOMAIN_OPTIONS,
  ONBOARDING_LAST_STEP,
  ONBOARDING_STEP_COPY,
  ONBOARDING_STEPS,
  TASK_OPTIONS,
  TOOL_OPTIONS,
} from './_constants/onboardingOptions';
import CheckIcon from './_components/CheckIcon';
import {
  CheckboxList,
  DomainGrid,
  RadioList,
} from './_components/OnboardingOptionGroup';
import OnboardingProgressBar from './_components/OnboardingProgressBar';
import { useOnboardingFlow } from './_hooks/useOnboardingFlow';
import { useOnboardingSubmit } from './_hooks/useOnboardingSubmit';

export default function OnboardingPage() {
  const router = useRouter();
  const onboarding = useOnboardingFlow();
  const onboardingSubmit = useOnboardingSubmit({
    onComplete: () => router.push('/analysis'),
  });

  const handlePrev = () => {
    if (onboarding.isFirstStep) {
      router.back();
    } else {
      onboarding.goToPreviousStep();
    }
  };

  const handleNext = () => {
    if (!onboarding.isLastStep) {
      onboarding.goToNextStep();
      return;
    }
    if (!onboarding.submission) return;
    void onboardingSubmit.submit(onboarding.submission);
  };

  const copy = ONBOARDING_STEP_COPY[onboarding.step];

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
            <Stepper steps={ONBOARDING_STEPS} currentStep={onboarding.step} />
          </aside>

          {/* 우측: 동일한 헤더 카피 + 진행 막대 + 선택 영역 */}
          <section className="flex flex-1 flex-col gap-24 px-32 py-40">
            <div className="flex flex-col gap-12">
              <h3 className="whitespace-pre-line text-head3 font-bold text-gray-900">
                {copy.title}
              </h3>
              <p className="text-body4 text-gray-700">{copy.description}</p>
              <OnboardingProgressBar
                current={onboarding.step}
                total={ONBOARDING_LAST_STEP}
              />
            </div>

            <div className="flex-1">
              {onboarding.step === 1 && (
                <DomainGrid
                  options={DOMAIN_OPTIONS}
                  value={onboarding.domain}
                  onChange={onboarding.setDomain}
                />
              )}
              {onboarding.step === 2 && (
                <RadioList
                  options={TASK_OPTIONS}
                  value={onboarding.task}
                  onChange={onboarding.setTask}
                />
              )}
              {onboarding.step === 3 && (
                <CheckboxList
                  options={TOOL_OPTIONS}
                  values={onboarding.tools}
                  onToggle={onboarding.toggleTool}
                />
              )}
            </div>
          </section>
        </div>

        {/* 하단 액션 바 */}
        <div className="flex items-center justify-end gap-12 border-t border-gray-200 px-32 py-20">
          {!onboarding.isFirstStep && (
            <Button
              variant="outlined"
              size="md"
              icon={<ArrowLeftIcon />}
              onClick={handlePrev}
            >
              이전
            </Button>
          )}
          {!onboarding.isLastStep ? (
            <Button
              variant="primary"
              size="md"
              icon={<ArrowRightIcon />}
              disabled={!onboarding.canGoNext}
              onClick={handleNext}
            >
              다음
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              icon={<CheckIcon />}
              disabled={!onboarding.canGoNext || onboardingSubmit.isPending}
              onClick={handleNext}
            >
              {onboardingSubmit.isPending ? '완료 중' : '완료'}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
