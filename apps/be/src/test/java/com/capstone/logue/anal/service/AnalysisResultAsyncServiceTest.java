package com.capstone.logue.anal.service;

import com.capstone.logue.anal.client.FastApiClient;
import com.capstone.logue.anal.dto.fastapi.request.AnalysisSummaryRequest;
import com.capstone.logue.anal.dto.fastapi.request.ChartDataInfo;
import com.capstone.logue.anal.dto.fastapi.response.AnalysisSummaryResponse;
import com.capstone.logue.anal.dto.fastapi.response.DescriptionInfo;
import com.capstone.logue.anal.dto.fastapi.response.SegmentInfo;
import com.capstone.logue.anal.dto.spring.response.GetQuestionResultResponse;
import com.capstone.logue.global.entity.AnalysisCriteria;
import com.capstone.logue.global.entity.AnalysisFlow;
import com.capstone.logue.global.entity.Conversation;
import com.capstone.logue.global.entity.DataSource;
import com.capstone.logue.global.entity.User;
import com.capstone.logue.global.entity.enums.AnalysisType;
import com.capstone.logue.global.entity.enums.MetricType;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.MissingNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.ResourceAccessException;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link AnalysisResultAsyncService} 단위 테스트.
 *
 * <p>집계 + FastAPI 호출의 4xx/5xx/네트워크/스키마 분기를 검증합니다.</p>
 */
@ExtendWith(MockitoExtension.class)
class AnalysisResultAsyncServiceTest {

    private static final Long JOB_ID = 1L;

    @Mock private JobStateService jobStateService;
    @Mock private ResultAggregationService resultAggregationService;
    @Mock private AnalysisSummaryRequestBuilder requestBuilder;
    @Mock private FastApiClient fastApiClient;

    private AnalysisResultAsyncService service;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        service = new AnalysisResultAsyncService(
                jobStateService, resultAggregationService, requestBuilder, fastApiClient);
    }

    private ResultJobContext stubContext() {
        User user = User.builder().id(1L).email("e").providerUserId("p").name("n").provider("GOOGLE").build();
        Conversation conversation = Conversation.builder().id(10L).user(user).title("t").build();
        DataSource dataSource = DataSource.builder()
                .id(5L).user(user).fileName("f").rowCount(1).columnCount(1)
                .schemaJson(objectMapper.createObjectNode()).build();
        AnalysisFlow flow = AnalysisFlow.builder()
                .id(11L).conversation(conversation).dataSource(dataSource).build();
        AnalysisCriteria criteria = AnalysisCriteria.builder()
                .id(33L).analysisFlow(flow)
                .analysisType(AnalysisType.COMPARISON).metricName("conversion_rate").metricType(MetricType.RATIO)
                .baseDateColumn("signed_at").standardPeriod("this_week").comparePeriod("last_week")
                .sortBy("delta").sortDirection("asc")
                .groupBy(objectMapper.valueToTree(List.of("channel")))
                .isConfirmed(true)
                .build();
        return new ResultJobContext(criteria, dataSource);
    }

    private void stubAggregation() {
        ResultAggregationService.AggregationResult agg =
                new ResultAggregationService.AggregationResult(List.of("channel"), "conversion_rate", List.of());
        lenient().when(resultAggregationService.aggregate(any(), any())).thenReturn(agg);
        lenient().when(resultAggregationService.toFastApiChartData(any()))
                .thenReturn(new ChartDataInfo(List.of("channel", "conversion_rate"), List.of()));
        lenient().when(resultAggregationService.toClientChartData(any()))
                .thenReturn(new GetQuestionResultResponse.ChartDataInfo(
                        List.of("channel"), "channel", List.of(), true));
        lenient().when(resultAggregationService.toPersistedChartData(any()))
                .thenReturn(MissingNode.getInstance());
    }

    private AnalysisSummaryResponse successResponse() {
        DescriptionInfo description = new DescriptionInfo(
                List.of(new SegmentInfo("요약", false)),
                "가입 전환율이 지난주 대비 낮은 순으로 채널을 나열했어요."
        );
        return new AnalysisSummaryResponse(String.valueOf(JOB_ID), description);
    }

    @Test
    @DisplayName("4xx 응답 시 재시도 없이 즉시 FAILED")
    void resolveResultAsync_4xx_failed() {
        when(jobStateService.markResultRunningAndGetContext(JOB_ID)).thenReturn(stubContext());
        stubAggregation();
        when(requestBuilder.build(any(), any(), any())).thenReturn(mock(AnalysisSummaryRequest.class));
        when(fastApiClient.describeAnalysisResult(any())).thenReturn(ResponseEntity.status(422).build());

        service.resolveResultAsync(JOB_ID);

        verify(jobStateService).markFailed(eq(JOB_ID), contains("4xx"));
        verify(jobStateService, never()).markRetrying(any(), any());
        verify(jobStateService, never()).saveResultAndMarkSuccess(any(), any(), any(), any());
    }

    @Test
    @DisplayName("5xx 응답 3회 연속이면 재시도 소진 후 FAILED")
    void resolveResultAsync_5xx_exhaustFailed() {
        when(jobStateService.markResultRunningAndGetContext(JOB_ID)).thenReturn(stubContext());
        stubAggregation();
        when(requestBuilder.build(any(), any(), any())).thenReturn(mock(AnalysisSummaryRequest.class));
        when(fastApiClient.describeAnalysisResult(any())).thenReturn(ResponseEntity.status(500).build());

        service.resolveResultAsync(JOB_ID);

        verify(fastApiClient, times(3)).describeAnalysisResult(any());
        verify(jobStateService, times(2)).markRetrying(eq(JOB_ID), any());
        verify(jobStateService).markFailed(eq(JOB_ID), contains("재시도 3회 소진"));
    }

    @Test
    @DisplayName("5xx 2회 후 성공이면 SUCCESS")
    void resolveResultAsync_5xxThenSuccess() {
        when(jobStateService.markResultRunningAndGetContext(JOB_ID)).thenReturn(stubContext());
        stubAggregation();
        when(requestBuilder.build(any(), any(), any())).thenReturn(mock(AnalysisSummaryRequest.class));
        when(fastApiClient.describeAnalysisResult(any()))
                .thenReturn(ResponseEntity.status(500).build())
                .thenReturn(ResponseEntity.status(500).build())
                .thenReturn(ResponseEntity.ok(successResponse()));

        service.resolveResultAsync(JOB_ID);

        verify(fastApiClient, times(3)).describeAnalysisResult(any());
        verify(jobStateService, times(2)).markRetrying(eq(JOB_ID), any());
        verify(jobStateService).saveResultAndMarkSuccess(eq(JOB_ID), any(), any(), any());
        verify(jobStateService, never()).markFailed(any(), any());
    }

    @Test
    @DisplayName("네트워크 에러 3회 소진 시 FAILED")
    void resolveResultAsync_network_exhaustFailed() {
        when(jobStateService.markResultRunningAndGetContext(JOB_ID)).thenReturn(stubContext());
        stubAggregation();
        when(requestBuilder.build(any(), any(), any())).thenReturn(mock(AnalysisSummaryRequest.class));
        when(fastApiClient.describeAnalysisResult(any()))
                .thenThrow(new ResourceAccessException("connection refused"));

        service.resolveResultAsync(JOB_ID);

        verify(fastApiClient, times(3)).describeAnalysisResult(any());
        verify(jobStateService).markFailed(eq(JOB_ID), contains("재시도 3회 소진"));
    }

    @Test
    @DisplayName("plainText 가 비어있으면 FAILED, 재시도 없음")
    void resolveResultAsync_blankPlainText_failed() {
        when(jobStateService.markResultRunningAndGetContext(JOB_ID)).thenReturn(stubContext());
        stubAggregation();
        when(requestBuilder.build(any(), any(), any())).thenReturn(mock(AnalysisSummaryRequest.class));

        AnalysisSummaryResponse blank = new AnalysisSummaryResponse(
                String.valueOf(JOB_ID),
                new DescriptionInfo(List.of(), "  ")
        );
        when(fastApiClient.describeAnalysisResult(any())).thenReturn(ResponseEntity.ok(blank));

        service.resolveResultAsync(JOB_ID);

        verify(fastApiClient, times(1)).describeAnalysisResult(any());
        verify(jobStateService).markFailed(eq(JOB_ID), contains("응답 검증 실패"));
        verify(jobStateService, never()).markRetrying(any(), any());
    }

    @Test
    @DisplayName("집계 단계가 LogueException 으로 실패하면 FAILED, FastAPI 호출 없음")
    void resolveResultAsync_aggregationFailure() {
        when(jobStateService.markResultRunningAndGetContext(JOB_ID)).thenReturn(stubContext());
        when(resultAggregationService.aggregate(any(), any()))
                .thenThrow(new LogueException(ErrorCode.COLUMN_NOT_FOUND));

        service.resolveResultAsync(JOB_ID);

        verify(jobStateService).markFailed(eq(JOB_ID), contains("집계 실패"));
        verify(fastApiClient, never()).describeAnalysisResult(any());
    }
}
