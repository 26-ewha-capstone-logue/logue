package com.capstone.logue.anal.dto.fastapi.response;

import java.util.List;

/**
 * FastAPI 가 도출한 구조화된 분석 기준입니다.
 *
 * <p>비교 분석(COMPARISON)일 때 {@code comparePeriod} 가, 순위 분석(RANKING)일 때 {@code limitNum} 이 채워집니다.</p>
 */
public record AnalysisCriteriaInfo(
        String analysisType,
        String metricName,
        String metricType,
        String formulaNumerator,
        String formulaDenominator,
        String baseDateColumn,
        String standardPeriod,
        String comparePeriod,
        String sortBy,
        String sortDirection,
        List<String> groupBy,
        Long limitNum,
        List<CriteriaFilterInfo> filters
) {
}
