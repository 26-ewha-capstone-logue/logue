package com.capstone.logue.anal.service;

import com.capstone.logue.anal.client.FastApiClient;
import com.capstone.logue.anal.dto.fastapi.request.FileAnalysisRequest;
import com.capstone.logue.data.repository.DataSourceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import com.capstone.logue.anal.dto.fastapi.response.ColumnRoleInfo;
import com.capstone.logue.anal.dto.fastapi.response.FileAnalysisResponse;
import com.capstone.logue.anal.dto.fastapi.response.WarningInfo;
import com.capstone.logue.global.entity.DataSource;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.client.ResourceAccessException;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

/**
 * {@link FileAnalysisAsyncService} 단위 테스트입니다.
 *
 * <p>
 * FastAPI 응답 유형별 에러 처리 및 재시도 로직을 검증합니다.
 * 외부 의존성은 모두 Mockito로 대체합니다.
 * </p>
 *
 * <p>검증 시나리오:</p>
 * <ul>
 *   <li>4xx 응답 시 재시도 없이 즉시 FAILED</li>
 *   <li>5xx 응답 3회 연속 시 재시도 소진 후 FAILED</li>
 *   <li>5xx 2회 후 성공 시 SUCCESS</li>
 *   <li>네트워크 에러 3회 소진 시 FAILED</li>
 *   <li>2xx지만 스키마 불일치 시 롤백 후 FAILED, 재시도 없음</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
public class AnalServiceV2Test {
    @Mock private JobStateService jobStateService;
    @Mock private FileAnalysisRequestBuilder fileAnalysisRequestBuilder;
    @Mock private FastApiClient fastApiClient;
    @Mock private DataSourceRepository dataSourceRepository;

    private FileAnalysisAsyncService service;

    private static final Long JOB_ID = 1L;
    private static final Long DATA_SOURCE_ID = 10L;

    @BeforeEach
    void setUp() {
        service = new FileAnalysisAsyncService(
                jobStateService,
                fileAnalysisRequestBuilder,
                fastApiClient
        );
    }

    @Test
    @DisplayName("4xx 응답 시 재시도 없이 즉시 FAILED 처리된다")
    void analyzeFileAsync_4xx_immediatelyFailed() {
        when(jobStateService.markRunningAndGetDataSource(JOB_ID, DATA_SOURCE_ID))
                .thenReturn(mockDataSource());
        when(fileAnalysisRequestBuilder.build(any(), any(), any(), anyInt(), anyInt(), any()))
                .thenReturn(mock(FileAnalysisRequest.class));
        when(fastApiClient.analyzeFile(any()))
                .thenReturn(ResponseEntity.status(422).build());

        service.analyzeFileAsync(JOB_ID, DATA_SOURCE_ID);

        verify(jobStateService).markFailed(eq(JOB_ID), contains("4xx"));
        verify(jobStateService, never()).markRetrying(any(), any());
        verify(jobStateService, never()).saveResultAndMarkSuccess(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("5xx 응답이 3회 연속이면 재시도 소진 후 FAILED 처리된다")
    void analyzeFileAsync_5xx_exhaustRetryAndFailed() {
        when(jobStateService.markRunningAndGetDataSource(JOB_ID, DATA_SOURCE_ID))
                .thenReturn(mockDataSource());
        when(fileAnalysisRequestBuilder.build(any(), any(), any(), anyInt(), anyInt(), any()))
                .thenReturn(mock(FileAnalysisRequest.class));
        when(fastApiClient.analyzeFile(any()))
                .thenReturn(ResponseEntity.status(500).build());

        service.analyzeFileAsync(JOB_ID, DATA_SOURCE_ID);

        verify(fastApiClient, times(3)).analyzeFile(any());
        verify(jobStateService, times(2)).markRetrying(eq(JOB_ID), any()); // 1,2회차
        verify(jobStateService).markFailed(eq(JOB_ID), contains("재시도 3회 소진"));
    }

    @Test
    @DisplayName("5xx 2회 후 성공하면 SUCCESS 처리된다")
    void analyzeFileAsync_5xxThenSuccess_markSuccess() {
        FileAnalysisResponse validResponse = new FileAnalysisResponse(String.valueOf(JOB_ID),
                List.of(),
                null,
                List.of());

        when(jobStateService.markRunningAndGetDataSource(JOB_ID, DATA_SOURCE_ID))
                .thenReturn(mockDataSource());
        when(fileAnalysisRequestBuilder.build(any(), any(), any(), anyInt(), anyInt(), any()))
                .thenReturn(mock(FileAnalysisRequest.class));
        when(fastApiClient.analyzeFile(any()))
                .thenReturn(ResponseEntity.status(500).build())
                .thenReturn(ResponseEntity.status(500).build())
                .thenReturn(ResponseEntity.ok(validResponse));

        service.analyzeFileAsync(JOB_ID, DATA_SOURCE_ID);

        verify(fastApiClient, times(3)).analyzeFile(any());
        verify(jobStateService, times(2)).markRetrying(eq(JOB_ID), any());
        verify(jobStateService).saveResultAndMarkSuccess(eq(JOB_ID), eq(DATA_SOURCE_ID), any(), any(), any());
        verify(jobStateService, never()).markFailed(any(), any());
    }

    @Test
    @DisplayName("네트워크 에러 3회 소진 시 FAILED 처리된다")
    void analyzeFileAsync_networkError_exhaustRetryAndFailed() {
        when(jobStateService.markRunningAndGetDataSource(JOB_ID, DATA_SOURCE_ID))
                .thenReturn(mockDataSource());
        when(fileAnalysisRequestBuilder.build(any(), any(), any(), anyInt(), anyInt(), any()))
                .thenReturn(mock(FileAnalysisRequest.class));
        when(fastApiClient.analyzeFile(any()))
                .thenThrow(new ResourceAccessException("Connection refused"));

        service.analyzeFileAsync(JOB_ID, DATA_SOURCE_ID);

        verify(fastApiClient, times(3)).analyzeFile(any());
        verify(jobStateService).markFailed(eq(JOB_ID), contains("재시도 3회 소진"));
    }

    @Test
    @DisplayName("2xx지만 스키마 불일치 시 롤백 후 FAILED, 재시도 없음")
    void analyzeFileAsync_schemaMismatch_failedWithoutRetry() {
        FileAnalysisResponse invalidResponse = new FileAnalysisResponse(
                String.valueOf(JOB_ID),
                List.of(new ColumnRoleInfo("없는컬럼", null, 0.0, null)),
                null,
                List.of()
        );

        when(jobStateService.markRunningAndGetDataSource(JOB_ID, DATA_SOURCE_ID))
                .thenReturn(mockDataSource());
        when(fileAnalysisRequestBuilder.build(any(), any(), any(), anyInt(), anyInt(), any()))
                .thenReturn(mock(FileAnalysisRequest.class));
        when(fastApiClient.analyzeFile(any()))
                .thenReturn(ResponseEntity.ok(invalidResponse));
        doThrow(new LogueException(ErrorCode.COLUMN_NOT_FOUND))
                .when(jobStateService).saveResultAndMarkSuccess(any(), any(), any(), any(), any());

        service.analyzeFileAsync(JOB_ID, DATA_SOURCE_ID);

        verify(fastApiClient, times(1)).analyzeFile(any()); // 재시도 없음
        verify(jobStateService).markFailed(eq(JOB_ID), contains("스키마 불일치"));
        verify(jobStateService, never()).markRetrying(any(), any());
    }

    private DataSource mockDataSource() {
        return DataSource.builder()
                .id(DATA_SOURCE_ID)
                .fileName("test.csv")
                .rowCount(10)
                .columnCount(3)
                .schemaJson(new ObjectMapper().createObjectNode())
                .build();
    }
}
