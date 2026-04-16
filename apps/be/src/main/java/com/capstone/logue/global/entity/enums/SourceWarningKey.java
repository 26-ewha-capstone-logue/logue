package com.capstone.logue.global.entity.enums;

/**
 * 데이터 소스({@link com.capstone.logue.global.entity.DataSource}) 수준에서
 * 발생할 수 있는 경고의 내부 식별 코드입니다.
 *
 * <ul>
 *   <li>{@link #DATE_FIELD_CONFLICT} - 날짜 필드 충돌: 데이터 소스 내 날짜 컬럼이 복수이거나
 *       의미가 중복되어 기준 날짜를 결정하기 어려운 상황입니다.</li>
 * </ul>
 */
public enum SourceWarningKey {
    DATE_FIELD_CONFLICT
}
