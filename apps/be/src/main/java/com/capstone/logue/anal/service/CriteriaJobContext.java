package com.capstone.logue.anal.service;

import com.capstone.logue.global.entity.AnalysisFlow;
import com.capstone.logue.global.entity.AnalysisFlowColumn;
import com.capstone.logue.global.entity.DataSource;
import com.capstone.logue.global.entity.DataSourceColumn;
import com.capstone.logue.global.entity.Message;

import java.util.List;

/**
 * 분석 기준 도출 비동기 작업이 RUNNING 으로 전이될 때 함께 로드되는 컨텍스트입니다.
 *
 * <p>{@link QuestionAnalysisRequestBuilder} 가 FastAPI 요청을 빌드하는 데 필요한 모든 영속 객체를
 * 트랜잭션 안에서 한 번에 모아 전달하기 위한 컨테이너입니다.</p>
 */
public record CriteriaJobContext(
        Message currentMessage,
        AnalysisFlow analysisFlow,
        DataSource dataSource,
        List<DataSourceColumn> dataSourceColumns,
        List<AnalysisFlowColumn> analysisFlowColumns,
        List<Message> previousMessages
) {
}
