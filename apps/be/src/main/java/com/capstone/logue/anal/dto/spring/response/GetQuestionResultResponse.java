package com.capstone.logue.anal.dto.spring.response;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

/**
 * 최종 분석 결과 조회 응답 DTO입니다.
 *
 * <p>{@code description} 은 LLM 이 생성한 자연어 한 줄 요약(plain text) 이며,
 * {@code chartData} 는 FE 가 차트 렌더링 / 탭 전환 / 엑스포트에 사용하는 시각화 데이터입니다.</p>
 */
public record GetQuestionResultResponse(
        Long resultId,
        String summaryMessage,
        String description,
        CriteriaInfo criteria,
        ChartDataInfo chartData
) {

    /**
     * 결과 생성에 사용된 확정 분석 기준의 사용자 노출용 요약입니다.
     */
    public record CriteriaInfo(
            String analysisType,
            String metricName,
            String baseDateColumn,
            String standardPeriod,
            String comparePeriod,
            List<String> groupBy,
            String sortBy,
            String sortDirection,
            List<FilterInfo> filters
    ) {
    }

    /**
     * 분석 기준에 적용된 필터 조건입니다.
     */
    public record FilterInfo(
            String field,
            String operator,
            JsonNode value
    ) {
    }

    /**
     * 차트 렌더링용 시각화 데이터입니다.
     */
    public record ChartDataInfo(
            List<String> tabs,
            String defaultTab,
            List<TabResultInfo> tabResults,
            boolean exportEnabled
    ) {
    }

    /**
     * 단일 탭의 차트 데이터입니다.
     */
    public record TabResultInfo(
            String tabName,
            ChartInfo chart
    ) {
    }

    /**
     * 차트 본문 — 단위, 라벨 시리즈, 값 시리즈입니다.
     */
    public record ChartInfo(
            String unit,
            List<String> labels,
            List<SeriesInfo> series
    ) {
    }

    /**
     * 차트 시리즈 한 줄입니다.
     */
    public record SeriesInfo(
            String name,
            List<Double> values
    ) {
    }
}
