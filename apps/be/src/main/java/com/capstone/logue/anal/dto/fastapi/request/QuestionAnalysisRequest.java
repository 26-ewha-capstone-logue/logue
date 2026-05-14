package com.capstone.logue.anal.dto.fastapi.request;

/**
 * FastAPI {@code POST /v1/llm/analysis-criteria/resolve} 요청 DTO입니다.
 *
 * <p>Spring → FastAPI 로 전송되는 질문 분석 페이로드를 표현합니다.
 * 직렬화 시 snake_case 로 변환됩니다 (AppConfig.fastApiRestTemplate).</p>
 */
public record QuestionAnalysisRequest(
        String requestId,
        Long conversationId,
        QuestionContextInfo question,
        QuestionDataSourceInfo dataSource,
        QuestionCatalogInfo catalog
) {
}
