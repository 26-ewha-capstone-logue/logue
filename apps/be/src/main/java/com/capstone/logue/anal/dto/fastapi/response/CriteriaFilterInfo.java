package com.capstone.logue.anal.dto.fastapi.response;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * 분석 기준에 적용되는 필터 조건입니다.
 *
 * <p>{@code value} 는 문자열/숫자/배열 등 임의 타입이므로 {@link JsonNode} 로 다룹니다.</p>
 */
public record CriteriaFilterInfo(
        String field,
        String operator,
        JsonNode value
) {
}
