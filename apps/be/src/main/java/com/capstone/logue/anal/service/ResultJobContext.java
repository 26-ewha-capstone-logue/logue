package com.capstone.logue.anal.service;

import com.capstone.logue.global.entity.AnalysisCriteria;
import com.capstone.logue.global.entity.DataSource;

/**
 * 분석 결과 도출 비동기 작업이 RUNNING 으로 전이될 때 함께 로드되는 컨텍스트입니다.
 *
 * <p>{@link AnalysisSummaryRequestBuilder} 가 FastAPI 요청을 빌드하고
 * {@link ResultAggregationService} 가 CSV 집계를 수행하는 데 필요한 영속 객체를
 * 한 번에 모아 전달하기 위한 컨테이너입니다.</p>
 */
public record ResultJobContext(
        AnalysisCriteria analysisCriteria,
        DataSource dataSource
) {
}
