package com.capstone.logue.global.entity.enums;

/**
 * 분석 방식(질문 유형)을 구분하는 타입 값입니다.
 *
 * <ul>
 *   <li>{@link #COMPARISON} - 기간 비교 분석: 기준 기간과 비교 기간의 지표 변화를 비교합니다.</li>
 *   <li>{@link #RANKING} - 순위 분석: 특정 기간 내 지표 기준으로 항목을 순위화합니다.</li>
 * </ul>
 */
public enum AnalysisType {
    COMPARISON,
    RANKING
}
