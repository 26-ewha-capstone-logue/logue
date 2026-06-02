export const ANALYSIS_DEFAULT_PROMPT = 'CSV 파일을 분석해 주세요';

export const ANALYSIS_WORKFLOW_MESSAGES = {
  invalidRoute: '분석 정보를 찾지 못했어요. 다시 시작해 주세요.',
  summary: {
    pending: 'CSV 데이터를 분석 중이에요',
    failed: 'CSV 데이터 요약에 실패했어요. 파일을 확인하고 다시 시도해 주세요.',
    getError:
      'CSV 데이터 요약을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
    canceled: 'CSV 데이터 요약을 취소했어요.',
    notReady: 'CSV 데이터 요약이 끝난 뒤 질문할 수 있어요.',
  },
  dataSource: {
    getError: 'CSV 미리보기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
  },
  question: {
    pending: '질문을 분석 중이에요',
    createError: '질문 분석을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.',
    getCriteriaError:
      '분석 기준을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
    canceled: '질문 분석을 취소했어요.',
  },
  criteria: {
    pending: '분석 기준을 확정 중이에요',
    updateError: '분석 기준을 확정하지 못했어요. 잠시 후 다시 시도해 주세요.',
    confirmed: '분석 기준이 확정되었어요.',
  },
  result: {
    pending: '최종 분석 결과를 생성 중이에요',
    getError: '최종 분석 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
    canceled: '최종 분석 결과 생성을 취소했어요.',
  },
  cancel: {
    error: '분석을 취소하지 못했어요. 잠시 후 다시 시도해 주세요.',
  },
} as const;
