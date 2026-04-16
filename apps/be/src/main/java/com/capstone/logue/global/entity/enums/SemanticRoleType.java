package com.capstone.logue.global.entity.enums;

/**
 * 분석 플로우에서 데이터 소스 컬럼에 부여하는 시맨틱 역할을 정의하는 타입 값입니다.
 *
 * <ul>
 *   <li>{@link #DATE_CRITERIA} - 날짜 기준 컬럼: 분석 기간을 결정하는 기준 날짜 컬럼입니다.</li>
 *   <li>{@link #MEASURE} - 측정값(지표) 컬럼: 집계·계산 대상이 되는 수치 컬럼입니다.</li>
 *   <li>{@link #DIMENSION} - 비교 기준(분류 축) 컬럼: 결과를 나눌 때 기준이 되는 범주 컬럼입니다.</li>
 *   <li>{@link #STATUS_CONDITION} - 상태 조건 컬럼: 포함/제외 필터에 사용하는 상태 구분 컬럼입니다.</li>
 *   <li>{@link #FLAG} - 플래그(이진 구분) 컬럼: true/false 혹은 0/1 형태의 이진 구분 컬럼입니다.</li>
 *   <li>{@link #ID_CRITERIA} - 식별자 기준 컬럼: 고유 식별자로서 집계 기준이 되는 컬럼입니다.</li>
 * </ul>
 */
public enum SemanticRoleType {
    DATE_CRITERIA,
    MEASURE,
    DIMENSION,
    STATUS_CONDITION,
    FLAG,
    ID_CRITERIA
}
