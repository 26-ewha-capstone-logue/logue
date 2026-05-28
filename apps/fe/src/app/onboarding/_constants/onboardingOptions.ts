export type OnboardingStepKey = 1 | 2 | 3;

export const ONBOARDING_LAST_STEP = 3;

export const ONBOARDING_STEPS = ['도메인 선택', '업무리스트', '사용 툴 선택'];

export const DOMAIN_OPTIONS = [
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

export const TASK_OPTIONS = [
  '캠페인 성과 확인',
  '광고 채널 효율 비교',
  '유입 경로 분석',
  '전환율 분석',
  'ROAS/광고비 효율 확인',
];

export const TOOL_OPTIONS = [
  'GA4',
  'Google Ads / Meta Ads Manager',
  'Amplitude',
  'Mixpanel',
  'Firebase Analytics',
];

export const ONBOARDING_STEP_COPY: Record<
  OnboardingStepKey,
  { title: string; description: string }
> = {
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
