package com.capstone.logue.global.entity.enums;

/**
 * 분석 기준({@link com.capstone.logue.global.entity.AnalysisCriteria}) 수준에서
 * 발생할 수 있는 경고의 내부 식별 코드입니다.
 *
 * <ul>
 *   <li>{@link #QUESTION_DATA_MISMATCH} - 질문·데이터 불일치: 사용자의 질문 의도와
 *       실제 데이터 구조 사이에 의미적 불일치가 감지된 경우입니다.</li>
 *   <li>{@link #CRITICAL_NULL_DETECTED} - 핵심 null 감지: 분석에 필수적인 컬럼에서
 *       허용 수준을 초과하는 null 비율이 발견된 경우입니다.</li>
 * </ul>
 */
public enum FlowWarningKey {
    QUESTION_DATA_MISMATCH,
    CRITICAL_NULL_DETECTED
}
