package com.capstone.logue.anal.service;

import com.capstone.logue.anal.dto.fastapi.request.AnalysisCriteriaSummaryInfo;
import com.capstone.logue.anal.dto.fastapi.request.AnalysisSummaryRequest;
import com.capstone.logue.anal.dto.fastapi.request.ChartDataInfo;
import com.capstone.logue.global.entity.AnalysisCriteria;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * FastAPI 분석 결과 요약 요청 DTO를 빌드하는 컴포넌트입니다.
 *
 * <p>locale 은 {@code "ko-KR"} 고정, metricDisplayName 매핑 카탈로그가 없으므로
 * metricName 을 그대로 노출용으로 재사용합니다.</p>
 */
@Component
public class AnalysisSummaryRequestBuilder {

    private static final String LOCALE = "ko-KR";

    /**
     * 확정 분석 기준과 집계 결과를 묶어 FastAPI 요청 DTO를 만듭니다.
     *
     * @param requestId        Spring 이 발급한 요청 추적 ID (보통 jobId 문자열)
     * @param analysisCriteria 확정된 분석 기준
     * @param chartData        Spring 이 집계한 결과 테이블
     * @return FastAPI 전송용 {@link AnalysisSummaryRequest}
     */
    public AnalysisSummaryRequest build(
            String requestId,
            AnalysisCriteria analysisCriteria,
            ChartDataInfo chartData
    ) {
        AnalysisCriteriaSummaryInfo criteriaInfo = new AnalysisCriteriaSummaryInfo(
                analysisCriteria.getAnalysisType().name(),
                analysisCriteria.getMetricName(),
                analysisCriteria.getMetricName(),
                analysisCriteria.getStandardPeriod(),
                analysisCriteria.getComparePeriod(),
                jsonArrayToStringList(analysisCriteria.getGroupBy()),
                analysisCriteria.getSortBy(),
                analysisCriteria.getSortDirection(),
                analysisCriteria.getLimitNum()
        );

        return new AnalysisSummaryRequest(requestId, criteriaInfo, chartData, LOCALE);
    }

    private List<String> jsonArrayToStringList(JsonNode node) {
        if (node == null || !node.isArray()) return List.of();
        List<String> result = new ArrayList<>();
        node.forEach(n -> result.add(n.asText()));
        return result;
    }
}
