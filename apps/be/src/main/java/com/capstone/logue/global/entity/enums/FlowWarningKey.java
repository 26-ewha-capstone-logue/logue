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
    QUESTION_DATA_MISMATCH(
            "필요한 항목이 없어요",
            "없는 항목은 다른 기준으로 바꿔서 계속할 수 있어요."
    ),
    CRITICAL_NULL_DETECTED(
            "분석에 필요한 값이 일부 비어 있어요",
            "비어 있는 값이 많아 결과가 부정확할 수 있어요."
    );

    private final String name;
    private final String comment;

    FlowWarningKey(String name, String comment) {
        this.name = name;
        this.comment = comment;
    }

    public String getName() { return name; }
    public String getComment() { return comment; }
}
