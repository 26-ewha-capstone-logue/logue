package com.capstone.logue.anal.dto.fastapi.request;

import java.util.List;

/**
 * FastAPI 질문 분석 요청에 포함되는 데이터 소스 메타데이터입니다.
 */
public record QuestionDataSourceInfo(
        Long id,
        List<QuestionDataSourceColumnInfo> columns
) {
}
