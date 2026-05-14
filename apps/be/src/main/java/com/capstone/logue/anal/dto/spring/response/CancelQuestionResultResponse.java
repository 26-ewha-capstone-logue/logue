package com.capstone.logue.anal.dto.spring.response;

/**
 * 최종 분석 결과 도출 취소 응답 DTO입니다.
 *
 * <p>{@code status} 는 항상 "CANCELLED" 입니다.</p>
 */
public record CancelQuestionResultResponse(
        String status
) {
}
