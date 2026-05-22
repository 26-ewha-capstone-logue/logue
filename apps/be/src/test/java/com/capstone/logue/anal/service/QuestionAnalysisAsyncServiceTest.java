package com.capstone.logue.anal.service;

import com.capstone.logue.anal.client.FastApiClient;
import com.capstone.logue.anal.dto.fastapi.request.QuestionAnalysisRequest;
import com.capstone.logue.anal.dto.fastapi.response.AnalysisCriteriaInfo;
import com.capstone.logue.anal.dto.fastapi.response.QuestionAnalysisResponse;
import com.capstone.logue.anal.dto.fastapi.response.UnsupportedQuestionInfo;
import com.capstone.logue.global.entity.AnalysisFlow;
import com.capstone.logue.global.entity.Conversation;
import com.capstone.logue.global.entity.DataSource;
import com.capstone.logue.global.entity.User;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link QuestionAnalysisAsyncService} 단위 테스트.
 *
 * <p>FastAPI 응답 유형별 에러 처리 및 재시도 로직, unsupported_question 처리를 검증합니다.</p>
 */
@ExtendWith(MockitoExtension.class)
class QuestionAnalysisAsyncServiceTest {

    private static final Long JOB_ID = 1L;
    private static final Long CONVERSATION_ID = 10L;
    private static final Long FLOW_ID = 11L;
    private static final Long DATASOURCE_ID = 5L;

    @Mock private JobStateService jobStateService;
    @Mock private QuestionAnalysisRequestBuilder requestBuilder;
    @Mock private FastApiClient fastApiClient;

    private QuestionAnalysisAsyncService service;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        service = new QuestionAnalysisAsyncService(jobStateService, requestBuilder, fastApiClient);
    }

    private CriteriaJobContext stubContext() {
        User user = User.builder().id(1L).email("e").providerUserId("p").name("n").provider("GOOGLE").build();
        Conversation conversation = Conversation.builder().id(CONVERSATION_ID).user(user).title("t").build();
        DataSource dataSource = DataSource.builder()
                .id(DATASOURCE_ID).user(user).fileName("f").rowCount(1).columnCount(1)
                .schemaJson(objectMapper.createObjectNode()).build();
        AnalysisFlow flow = AnalysisFlow.builder()
                .id(FLOW_ID).conversation(conversation).dataSource(dataSource).build();
        return new CriteriaJobContext(null, flow, dataSource, List.of(), List.of(), List.of());
    }

    private QuestionAnalysisResponse successResponse() {
        AnalysisCriteriaInfo criteria = new AnalysisCriteriaInfo(
                "COMPARISON", "conversion_rate", "RATIO",
                "signup_complete", "landing_sessions",
                "signed_at", "this_week", "last_week",
                "delta", "asc",
                List.of("channel"),
                null, List.of()
        );
        return new QuestionAnalysisResponse(
                String.valueOf(JOB_ID), criteria, List.of(), List.of(), null);
    }

    @Test
    @DisplayName("4xx 응답 시 재시도 없이 즉시 FAILED")
    void resolveCriteriaAsync_4xx_failed() {
        when(jobStateService.markCriteriaRunningAndGetContext(JOB_ID)).thenReturn(stubContext());
        when(requestBuilder.build(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(mock(QuestionAnalysisRequest.class));
        when(fastApiClient.resolveAnalysisCriteria(any()))
                .thenReturn(ResponseEntity.status(422).build());

        service.resolveCriteriaAsync(JOB_ID, "Q?");

        verify(jobStateService).markFailed(eq(JOB_ID), contains("4xx"));
        verify(jobStateService, never()).markRetrying(any(), any());
        verify(jobStateService, never()).saveCriteriaAndMarkSuccess(any(), any());
    }

    @Test
    @DisplayName("5xx 응답 3회 연속이면 재시도 소진 후 FAILED")
    void resolveCriteriaAsync_5xx_exhaustFailed() {
        when(jobStateService.markCriteriaRunningAndGetContext(JOB_ID)).thenReturn(stubContext());
        when(requestBuilder.build(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(mock(QuestionAnalysisRequest.class));
        when(fastApiClient.resolveAnalysisCriteria(any()))
                .thenReturn(ResponseEntity.status(500).build());

        service.resolveCriteriaAsync(JOB_ID, "Q?");

        verify(fastApiClient, times(3)).resolveAnalysisCriteria(any());
        verify(jobStateService, times(2)).markRetrying(eq(JOB_ID), any());
        verify(jobStateService).markFailed(eq(JOB_ID), contains("재시도 3회 소진"));
    }

    @Test
    @DisplayName("5xx 2회 후 성공이면 SUCCESS")
    void resolveCriteriaAsync_5xxThenSuccess() {
        when(jobStateService.markCriteriaRunningAndGetContext(JOB_ID)).thenReturn(stubContext());
        when(requestBuilder.build(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(mock(QuestionAnalysisRequest.class));
        when(fastApiClient.resolveAnalysisCriteria(any()))
                .thenReturn(ResponseEntity.status(500).build())
                .thenReturn(ResponseEntity.status(500).build())
                .thenReturn(ResponseEntity.ok(successResponse()));

        service.resolveCriteriaAsync(JOB_ID, "Q?");

        verify(fastApiClient, times(3)).resolveAnalysisCriteria(any());
        verify(jobStateService, times(2)).markRetrying(eq(JOB_ID), any());
        verify(jobStateService).saveCriteriaAndMarkSuccess(eq(JOB_ID), any());
        verify(jobStateService, never()).markFailed(any(), any());
    }

    @Test
    @DisplayName("네트워크 에러 3회 소진 시 FAILED")
    void resolveCriteriaAsync_network_exhaustFailed() {
        when(jobStateService.markCriteriaRunningAndGetContext(JOB_ID)).thenReturn(stubContext());
        when(requestBuilder.build(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(mock(QuestionAnalysisRequest.class));
        when(fastApiClient.resolveAnalysisCriteria(any()))
                .thenThrow(new ResourceAccessException("Connection refused"));

        service.resolveCriteriaAsync(JOB_ID, "Q?");

        verify(fastApiClient, times(3)).resolveAnalysisCriteria(any());
        verify(jobStateService).markFailed(eq(JOB_ID), contains("재시도 3회 소진"));
    }

    @Test
    @DisplayName("2xx 인데 스키마 불일치(LogueException) 면 재시도 없이 FAILED")
    void resolveCriteriaAsync_schemaMismatch_failed() {
        when(jobStateService.markCriteriaRunningAndGetContext(JOB_ID)).thenReturn(stubContext());
        when(requestBuilder.build(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(mock(QuestionAnalysisRequest.class));
        when(fastApiClient.resolveAnalysisCriteria(any()))
                .thenReturn(ResponseEntity.ok(successResponse()));
        doThrow(new LogueException(ErrorCode.COLUMN_NOT_FOUND))
                .when(jobStateService).saveCriteriaAndMarkSuccess(any(), any());

        service.resolveCriteriaAsync(JOB_ID, "Q?");

        verify(fastApiClient, times(1)).resolveAnalysisCriteria(any());
        verify(jobStateService).markFailed(eq(JOB_ID), contains("스키마 불일치"));
        verify(jobStateService, never()).markRetrying(any(), any());
    }

    @Test
    @DisplayName("unsupported_question 응답 시 saveCriteriaAndMarkSuccess 가 호출되어 분기 처리")
    void resolveCriteriaAsync_unsupported_routesToSave() {
        when(jobStateService.markCriteriaRunningAndGetContext(JOB_ID)).thenReturn(stubContext());
        when(requestBuilder.build(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(mock(QuestionAnalysisRequest.class));

        UnsupportedQuestionInfo unsupported = new UnsupportedQuestionInfo("MVP 미지원 질문 유형", "funnel");
        QuestionAnalysisResponse response = new QuestionAnalysisResponse(
                String.valueOf(JOB_ID), null, List.of(), List.of(), unsupported);

        when(fastApiClient.resolveAnalysisCriteria(any()))
                .thenReturn(ResponseEntity.ok(response));

        service.resolveCriteriaAsync(JOB_ID, "Q?");

        verify(fastApiClient, times(1)).resolveAnalysisCriteria(any());
        verify(jobStateService).saveCriteriaAndMarkSuccess(eq(JOB_ID),
                argThat(r -> r.unsupportedQuestion() != null
                        && r.unsupportedQuestion().reason().contains("MVP")));
        verify(jobStateService, never()).markRetrying(any(), any());
    }
}
