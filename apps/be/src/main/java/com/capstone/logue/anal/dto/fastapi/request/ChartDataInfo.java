package com.capstone.logue.anal.dto.fastapi.request;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

/**
 * Spring 이 집계 쿼리로 계산한 결과 테이블입니다.
 *
 * <p>각 row 의 길이는 {@code columns} 길이와 같습니다. 값은 문자열/숫자/불리언 등 임의 타입이라
 * {@link JsonNode} 로 다룹니다.</p>
 */
public record ChartDataInfo(
        List<String> columns,
        List<List<JsonNode>> rows
) {
}
