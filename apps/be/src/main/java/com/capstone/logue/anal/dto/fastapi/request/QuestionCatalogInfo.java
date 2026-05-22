package com.capstone.logue.anal.dto.fastapi.request;

import java.util.List;

/**
 * FastAPI 질문 분석 요청에 포함되는 카탈로그 정보입니다.
 *
 * <p>지원하는 ENUM 값 목록 + Pre-defined 지표 + flow warning 정의를 한 번에 전달합니다.</p>
 */
public record QuestionCatalogInfo(
        List<String> analysisTypes,
        List<String> metricTypes,
        List<PredefinedMetricInfo> predefinedMetrics,
        List<String> supportedPeriods,
        List<FlowWarningKeyInfo> flowWarningKeys
) {
}
