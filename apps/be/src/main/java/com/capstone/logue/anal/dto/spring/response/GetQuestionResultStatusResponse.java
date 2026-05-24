package com.capstone.logue.anal.dto.spring.response;

/**
 * 최종 분석 결과 도출 작업 상태 응답 DTO입니다.
 *
 * <p>{@code status} 값: QUEUED / RUNNING / RETRYING / SUCCESS / FAILED / CANCELED</p>
 */
public record GetQuestionResultStatusResponse(
        String status
) {
}
