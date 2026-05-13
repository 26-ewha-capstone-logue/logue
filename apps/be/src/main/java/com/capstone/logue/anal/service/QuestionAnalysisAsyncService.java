package com.capstone.logue.anal.service;

import com.capstone.logue.anal.client.FastApiClient;
import com.capstone.logue.anal.dto.fastapi.request.QuestionAnalysisRequest;
import com.capstone.logue.anal.dto.fastapi.response.QuestionAnalysisResponse;
import com.capstone.logue.global.exception.LogueException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;

/**
 * 질문 → 분석 기준 도출을 위한 FastAPI 호출을 비동기로 수행하는 서비스입니다.
 *
 * <p>트랜잭션 흐름은 {@link FileAnalysisAsyncService} 와 동일합니다.</p>
 * <pre>
 * [트랜잭션 1: markCriteriaRunningAndGetContext]
 *        ↓
 * [트랜잭션 없음: FastAPI 호출 - 재시도 루프]
 *   - 5xx / 네트워크 에러: 최대 3회 재시도 (1s→2s→4s ±30% jitter), RETRYING 상태 전환
 *   - 4xx: 재시도 없이 즉시 FAILED
 *   - 2xx 스키마 불일치: 트랜잭션 롤백 후 FAILED
 *        ↓
 * [트랜잭션 2: saveCriteriaAndMarkSuccess]
 *        또는
 * [트랜잭션 3: markFailed]
 * </pre>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionAnalysisAsyncService {

    private static final int MAX_ATTEMPTS = 3;

    private final JobStateService jobStateService;
    private final QuestionAnalysisRequestBuilder requestBuilder;
    private final FastApiClient fastApiClient;

    /**
     * 분석 기준 도출 비동기 작업을 수행합니다.
     *
     * @param jobId      분석 기준 도출 작업 ID
     * @param question   사용자 질문 원문
     */
    @Async
    public void resolveCriteriaAsync(Long jobId, String question) {
        CriteriaJobContext context = jobStateService.markCriteriaRunningAndGetContext(jobId);

        QuestionAnalysisRequest request = requestBuilder.build(
                String.valueOf(jobId),
                context.analysisFlow().getConversation().getId(),
                question,
                context.previousMessages(),
                context.dataSource(),
                context.dataSourceColumns(),
                context.analysisFlowColumns()
        );

        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                ResponseEntity<QuestionAnalysisResponse> response = fastApiClient.resolveAnalysisCriteria(request);
                int status = response.getStatusCode().value();

                if (status >= 400 && status < 500) {
                    log.warn("[QuestionAnalysisAsyncService] 4xx 에러 - 즉시 FAILED: jobId={}, status={}", jobId, status);
                    jobStateService.markFailed(jobId, "FastAPI 4xx 에러: " + status);
                    return;
                }

                if (status >= 500) {
                    log.warn("[QuestionAnalysisAsyncService] 5xx 에러: jobId={}, status={}, attempt={}", jobId, status, attempt);
                    handleRetryOrFail(jobId, attempt, "FastAPI 5xx 에러: " + status);
                    continue;
                }

                jobStateService.saveCriteriaAndMarkSuccess(jobId, response.getBody());
                log.info("[QuestionAnalysisAsyncService] 분석 기준 도출 완료: jobId={}", jobId);
                return;

            } catch (ResourceAccessException e) {
                log.warn("[QuestionAnalysisAsyncService] 네트워크 에러: jobId={}, attempt={}, msg={}", jobId, attempt, e.getMessage());
                handleRetryOrFail(jobId, attempt, "네트워크 에러: " + e.getMessage());
            } catch (LogueException e) {
                log.warn("[QuestionAnalysisAsyncService] 스키마 불일치 - FAILED: jobId={}, msg={}", jobId, e.getMessage());
                jobStateService.markFailed(jobId, "응답 스키마 불일치: " + e.getMessage());
                return;
            } catch (Exception e) {
                log.error("[QuestionAnalysisAsyncService] 예상치 못한 에러: jobId={}", jobId, e);
                jobStateService.markFailed(jobId, e.getMessage());
                return;
            }
        }
    }

    private void handleRetryOrFail(Long jobId, int attempt, String errorMessage) {
        if (attempt == MAX_ATTEMPTS) {
            log.warn("[QuestionAnalysisAsyncService] 재시도 소진 - FAILED: jobId={}", jobId);
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
}
