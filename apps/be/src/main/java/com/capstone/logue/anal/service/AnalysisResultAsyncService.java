package com.capstone.logue.anal.service;

import com.capstone.logue.anal.client.FastApiClient;
import com.capstone.logue.anal.dto.fastapi.request.AnalysisSummaryRequest;
import com.capstone.logue.anal.dto.fastapi.request.ChartDataInfo;
import com.capstone.logue.anal.dto.fastapi.response.AnalysisSummaryResponse;
import com.capstone.logue.anal.dto.spring.response.GetQuestionResultResponse;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;

/**
 * 분석 결과 도출 (집계 + FastAPI 자연어 요약 호출 + 영속화)을 비동기로 수행하는 서비스입니다.
 *
 * <p>{@link QuestionAnalysisAsyncService} 와 동일한 재시도/실패 패턴을 따릅니다.</p>
 * <pre>
 * [트랜잭션 1: markResultRunningAndGetContext]
 *        ↓
 * [트랜잭션 없음: 집계 + FastAPI 호출 - 재시도 루프]
 *   - 5xx / 네트워크 에러: 최대 3회 재시도 (1s→2s→4s ±30% jitter), RETRYING 상태 전환
 *   - 4xx: 재시도 없이 즉시 FAILED
 *   - 2xx 인데 plainText 비어 있으면 LogueException(LLM_CALL_FAILED) → FAILED
 *        ↓
 * [트랜잭션 2: saveResultAndMarkSuccess]
 *        또는
 * [트랜잭션 3: markFailed]
 * </pre>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisResultAsyncService {

    private static final int MAX_ATTEMPTS = 3;

    private final JobStateService jobStateService;
    private final ResultAggregationService resultAggregationService;
    private final AnalysisSummaryRequestBuilder requestBuilder;
    private final FastApiClient fastApiClient;

    /**
     * 분석 결과 도출 비동기 작업을 수행합니다.
     *
     * @param jobId 분석 결과 도출 작업 ID
     */
    @Async
    public void resolveResultAsync(Long jobId) {
        ResultJobContext context = jobStateService.markResultRunningAndGetContext(jobId);

        ResultAggregationService.AggregationResult aggregation;
        ChartDataInfo fastApiChartData;
        GetQuestionResultResponse.ChartDataInfo clientChartData;
        try {
            aggregation = resultAggregationService.aggregate(context.analysisCriteria(), context.dataSource());
            fastApiChartData = resultAggregationService.toFastApiChartData(aggregation);
            clientChartData = resultAggregationService.toClientChartData(aggregation);
        } catch (LogueException e) {
            log.warn("[AnalysisResultAsyncService] 집계 실패 - FAILED: jobId={}, msg={}", jobId, e.getMessage());
            jobStateService.markFailed(jobId, "집계 실패: " + e.getMessage());
            return;
        } catch (Exception e) {
            log.error("[AnalysisResultAsyncService] 집계 중 예상치 못한 에러: jobId={}", jobId, e);
            jobStateService.markFailed(jobId, "집계 에러: " + e.getMessage());
            return;
        }

        AnalysisSummaryRequest request = requestBuilder.build(
                String.valueOf(jobId),
                context.analysisCriteria(),
                fastApiChartData
        );

        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                ResponseEntity<AnalysisSummaryResponse> response = fastApiClient.describeAnalysisResult(request);
                int status = response.getStatusCode().value();

                if (status >= 400 && status < 500) {
                    log.warn("[AnalysisResultAsyncService] 4xx 에러 - 즉시 FAILED: jobId={}, status={}", jobId, status);
                    jobStateService.markFailed(jobId, "FastAPI 4xx 에러: " + status);
                    return;
                }

                if (status >= 500) {
                    log.warn("[AnalysisResultAsyncService] 5xx 에러: jobId={}, status={}, attempt={}", jobId, status, attempt);
                    handleRetryOrFail(jobId, attempt, "FastAPI 5xx 에러: " + status);
                    continue;
                }

                AnalysisSummaryResponse body = response.getBody();
                if (body == null || body.description() == null || isBlank(body.description().plainText())) {
                    throw new LogueException(ErrorCode.LLM_CALL_FAILED);
                }

                JsonNode persistedChartData = resultAggregationService.toPersistedChartData(clientChartData);
                jobStateService.saveResultAndMarkSuccess(
                        jobId,
                        truncate(body.description().plainText(), 255),
                        persistedChartData,
                        context.analysisCriteria()
                );
                log.info("[AnalysisResultAsyncService] 분석 결과 도출 완료: jobId={}", jobId);
                return;

            } catch (ResourceAccessException e) {
                log.warn("[AnalysisResultAsyncService] 네트워크 에러: jobId={}, attempt={}, msg={}", jobId, attempt, e.getMessage());
                handleRetryOrFail(jobId, attempt, "네트워크 에러: " + e.getMessage());
            } catch (LogueException e) {
                log.warn("[AnalysisResultAsyncService] LLM 호출 응답 검증 실패 - FAILED: jobId={}, msg={}", jobId, e.getMessage());
                jobStateService.markFailed(jobId, "응답 검증 실패: " + e.getMessage());
                return;
            } catch (Exception e) {
                log.error("[AnalysisResultAsyncService] 예상치 못한 에러: jobId={}", jobId, e);
                jobStateService.markFailed(jobId, e.getMessage());
                return;
            }
        }
    }

    private void handleRetryOrFail(Long jobId, int attempt, String errorMessage) {
        if (attempt == MAX_ATTEMPTS) {
            log.warn("[AnalysisResultAsyncService] 재시도 소진 - FAILED: jobId={}", jobId);
            jobStateService.markFailed(jobId, "재시도 3회 소진: " + errorMessage);
            return;
        }
        jobStateService.markRetrying(jobId, errorMessage);
        sleep(backoffMillis(attempt));
    }

    private long backoffMillis(int attempt) {
        long base = (long) (1000 * Math.pow(2, attempt - 1));
        double jitter = 1.0 + (Math.random() * 0.6 - 0.3);
        return (long) (base * jitter);
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
