package com.capstone.logue.anal.dto.fastapi.request;

/**
 * FastAPI {@code POST /v1/llm/analysis-results/describe} 요청 DTO입니다.
 *
 * <p>확정된 분석 기준 요약 + Spring 이 집계한 결과 테이블을 LLM 에 전달해
 * 자연어 한 줄 설명(강조 세그먼트 포함) 을 받아오는 데 사용됩니다.</p>
 */
public record AnalysisSummaryRequest(
        String requestId,
        AnalysisCriteriaSummaryInfo analysisCriteria,
        ChartDataInfo chartData,
        String locale
) {
}
