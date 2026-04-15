package com.capstone.logue.global.entity.enums;

/**
 * AI 태깅 작업({@link com.capstone.logue.global.entity.AiTaggingJob})이 처리하는
 * 파이프라인 단계를 나타내는 값입니다.
 *
 * <ul>
 *   <li>{@link #DATA_STATUS} - 데이터 상태 분석 단계: 업로드된 데이터의 품질과 상태를 분석합니다.</li>
 *   <li>{@link #ANALYSIS_CRITERIA} - 분석 기준 생성 단계: 사용자 질문을 바탕으로 분석 기준을 도출합니다.</li>
 *   <li>{@link #ANALYSIS_RESULT} - 분석 결과 생성 단계: 확정된 기준으로 최종 분석 결과를 생성합니다.</li>
 * </ul>
 */
public enum JobStage {
    DATA_STATUS,
    ANALYSIS_CRITERIA,
    ANALYSIS_RESULT
}
