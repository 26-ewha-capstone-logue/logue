package com.capstone.logue.anal.dto.fastapi.request;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * FastAPI 질문 분석 요청에 포함되는 컬럼 메타데이터입니다.
 *
 * <p>sample_values 는 실제 값을 그대로 직렬화하기 위해 {@link JsonNode} 로 다룹니다.</p>
 */
public record QuestionDataSourceColumnInfo(
        String columnName,
        String dataType,
        String semanticRole,
        Double nullRatio,
        JsonNode sampleValues
) {
}
