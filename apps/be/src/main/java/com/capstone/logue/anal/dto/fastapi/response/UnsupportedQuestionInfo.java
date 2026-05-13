package com.capstone.logue.anal.dto.fastapi.response;

/**
 * 지원하지 않는 질문 유형인 경우 FastAPI 가 반환하는 사유입니다.
 *
 * <p>이 필드가 null 이 아니면 {@link QuestionAnalysisResponse#analysisCriteria()} 는 null 입니다.</p>
 */
public record UnsupportedQuestionInfo(
        String reason,
        String detectedIntent
) {
}
