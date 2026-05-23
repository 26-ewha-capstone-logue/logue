package com.capstone.logue.anal.dto.fastapi.response;

/**
 * FastAPI {@code POST /v1/llm/analysis-results/describe} 응답 DTO입니다.
 *
 * <p>{@code description.segments} 의 텍스트를 이어붙이면 {@code description.plainText} 와 일치합니다.</p>
 */
public record AnalysisSummaryResponse(
        String requestId,
        DescriptionInfo description
) {
}
