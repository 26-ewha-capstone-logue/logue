package com.capstone.logue.anal.dto.fastapi.request;

import java.util.List;

/**
 * 결과 요약 호출에 포함되는 확정 분석 기준 요약 정보입니다.
 *
 * <p>RANKING 분석일 때 {@code limitNum}, COMPARISON 분석일 때 {@code comparePeriod} 가 채워집니다.</p>
 */
public record AnalysisCriteriaSummaryInfo(
        String analysisType,
        String metricName,
        String metricDisplayName,
        String standardPeriod,
        String comparePeriod,
        List<String> groupBy,
        String sortBy,
        String sortDirection,
        Long limitNum
) {
}
