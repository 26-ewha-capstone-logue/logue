package com.capstone.logue.anal.dto.spring.response;

import java.time.OffsetDateTime;

/**
 * 분석 기준 수정/확정 응답 DTO입니다.
 *
 * <p>{@code confirmedAt} 은 confirmed=false 로 저장된 경우 null 입니다.</p>
 */
public record UpdateQuestionCriteriaResponse(
        Long analysisCriteriaId,
        OffsetDateTime confirmedAt
) {
}
