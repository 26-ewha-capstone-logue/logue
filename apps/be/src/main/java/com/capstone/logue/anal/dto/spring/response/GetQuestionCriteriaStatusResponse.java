package com.capstone.logue.anal.dto.spring.response;

/**
 * 분석 기준 도출 작업 상태 응답 DTO입니다.
 *
 * <p>{@code status} 값: QUEUED / RUNNING / RETRYING / SUCCESS / FAILED / CANCELED</p>
 *
 * <p>{@code failureCode} 는 {@code status} 가 FAILED 일 때 실패 원인을 구분하기 위한
 * 머신 리더블 코드입니다. 의도된 "지원하지 않는 질문" 실패와 일시적 실패를 클라이언트가
 * 구분할 수 있게 합니다.</p>
 *
 * <ul>
 *     <li>{@code UNSUPPORTED_QUESTION}: 지원하지 않는 질문으로 인한 의도된 실패</li>
 *     <li>{@code ANALYSIS_FAILED}: 그 외 분석 실패(일시적 실패 포함)</li>
 *     <li>{@code null}: FAILED 가 아닌 경우</li>
 * </ul>
 */
public record GetQuestionCriteriaStatusResponse(
        String status,
        String failureCode
) {
}
