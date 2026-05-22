package com.capstone.logue.anal.dto.spring.request;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

/**
 * 분석 기준 수정/확정 API 요청 DTO입니다.
 *
 * <p>{@code confirmed=true} 인 경우 서버에서 확정 처리(isConfirmed=true, confirmedAt=now)를 수행합니다.</p>
 *
 * <p>{@code filters} 의 value 는 임의 타입이므로 {@link JsonNode} 로 받습니다.</p>
 */
public record UpdateQuestionCriteriaRequest(
        String baseDateColumn,
        String standardPeriod,
        String comparePeriod,
        List<String> groupBy,
        String sortBy,
        String sortDirection,
        Long limitNum,
        List<FilterInfo> filters,
        boolean confirmed
) {

    /**
     * 분석 기준에 적용할 필터 조건입니다.
     */
    public record FilterInfo(
            String field,
            String operator,
            JsonNode value
    ) {
    }
}
