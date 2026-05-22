package com.capstone.logue.anal.dto.fastapi.response;

import java.util.List;

/**
 * FastAPI {@code POST /v1/llm/analysis-criteria/resolve} 응답 DTO입니다.
 *
 * <p>{@code unsupportedQuestion} 이 null 이 아닌 경우 {@code analysisCriteria} 는 null 입니다.</p>
 */
public record QuestionAnalysisResponse(
        String requestId,
        AnalysisCriteriaInfo analysisCriteria,
        List<FlowColumnInfo> flowColumns,
        List<FlowWarningInfo> warnings,
        UnsupportedQuestionInfo unsupportedQuestion
) {
}
