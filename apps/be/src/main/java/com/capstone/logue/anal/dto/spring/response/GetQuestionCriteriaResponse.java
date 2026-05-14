package com.capstone.logue.anal.dto.spring.response;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * 분석 기준 조회 응답 DTO입니다.
 *
 * <p>분석 기준 도출이 완료된 시점에 호출되며, 분석 기준 본문과 함께
 * 사용자 확인이 필요한 필드 목록({@code needConfirm}) 및 데이터 경고를 반환합니다.</p>
 */
public record GetQuestionCriteriaResponse(
        Long messageId,
        String question,
        String message,
        CriteriaInfo criteria,
        OffsetDateTime createdAt
) {

    /**
     * 분석 기준 본문입니다.
     *
     * <p>{@code dataWarning} 은 사용자에게 노출되는 경고 메시지 리스트이며,
     * {@code needConfirm} 은 색상 강조 등 FE 처리가 필요한 필드명 리스트입니다.</p>
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
            Long limitNum,
            List<FilterInfo> filters,
            List<DataWarningItem> dataWarning,
            List<String> needConfirm
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
     * 사용자에게 노출되는 데이터 경고 항목입니다.
     */
    public record DataWarningItem(
            int order,
            String content
    ) {
    }
}
