package com.capstone.logue.anal.service;

import com.capstone.logue.anal.client.FastApiClient;
import com.capstone.logue.anal.dto.fastapi.response.ColumnRoleInfo;
import com.capstone.logue.anal.dto.fastapi.response.FileAnalysisResponse;
import com.capstone.logue.anal.dto.fastapi.response.WarningInfo;
import com.capstone.logue.anal.dto.fastapi.request.FileAnalysisRequest;
import com.capstone.logue.global.entity.DataSource;
import com.capstone.logue.global.exception.LogueException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;

import java.util.List;

/**
 * 파일 분석 비동기 작업을 처리하는 서비스입니다.
 *
 * <p>
 * DB 작업은 JobStateService에 위임하여 트랜잭션 범위를 최소화합니다.
 * FastAPI 호출 구간은 트랜잭션 없이 실행되어 DB 커넥션을 점유하지 않습니다.
 * </p>
 *
 * <p>트랜잭션 흐름:</p>
 * <pre>
 * [트랜잭션 1: markRunning]
 *        ↓
 * [트랜잭션 없음: FastAPI 호출]
 *        ↓
 * [트랜잭션 2: 결과 저장 + markSuccess]
 *        또는
 * [트랜잭션 3: markFailed]
 * </pre>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileAnalysisAsyncService {

    private static final int MAX_ATTEMPTS = 3;

    private final JobStateService jobStateService;
    private final FileAnalysisRequestBuilder fileAnalysisRequestBuilder;
    private final FastApiClient fastApiClient;

    @Value("${ai.base-url}")
    private String fastApiBaseUrl;

    /**
     * FastAPI 파일 분석 요청을 비동기로 수행합니다.
     * 이 메서드 자체에는 @Transactional을 걸지 않습니다.
     * DB 커넥션은 JobStateService의 각 메서드 안에서만 점유됩니다.
     *
     * <p>트랜잭션 흐름:</p>
     * <pre>
     * [트랜잭션 1: markRunning]
     *        ↓
     * [트랜잭션 없음: FastAPI 호출 - 재시도 루프]
     *   - 5xx / 네트워크 에러: 최대 3회 재시도 (1s→2s→4s ±30% jitter)
     *   - 4xx: 재시도 없이 즉시 FAILED
     *   - 2xx 스키마 불일치: 롤백 후 FAILED
     *        ↓
     * [트랜잭션 2: 결과 저장 + SUCCESS]
     *        또는
     * [트랜잭션 3: markFailed]
     * </pre>
     *
     * @param jobId      파일 분석 작업 ID
     * @param dataSourceId 분석 대상 데이터 소스 ID
     */
    @Async
    public void analyzeFileAsync(Long jobId, Long dataSourceId) {
        // 트랜잭션 1 - RUNNING 상태 변경 + DataSource 조회
        DataSource dataSource = jobStateService.markRunningAndGetDataSource(jobId, dataSourceId);

        // 트랜잭션 없음 - FastAPI 호출 (수십 초 소요 가능)
        FileAnalysisRequest fileAnalysisRequest = buildRequest(jobId, dataSource);

        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                ResponseEntity<FileAnalysisResponse> responseEntity = fastApiClient.analyzeFile(fileAnalysisRequest);
                int status = responseEntity.getStatusCode().value();

                // 4xx: 재시도 없이 즉시 FAILED
                if (status >= 400 && status < 500) {
                    log.warn("[FileAnalysisAsyncService] 4xx 에러 - 즉시 FAILED: jobId={}, status={}", jobId, status);
                    jobStateService.markFailed(jobId, "FastAPI 4xx 에러: " + status);
                    return;
                }

                // 5xx: 재시도
                if (status >= 500) {
                    log.warn("[FileAnalysisAsyncService] 5xx 에러: jobId={}, status={}, attempt={}", jobId, status, attempt);
                    handleRetryOrFail(jobId, attempt, "FastAPI 5xx 에러: " + status);
                    continue;
                }

                // 2xx: 스키마 validation 후 저장
                // 불일치 시 saveResultAndMarkSuccess 내부에서 LogueException 발생 → 트랜잭션 롤백
                FileAnalysisResponse body = responseEntity.getBody();
                List<ColumnRoleInfo> columnRoles = body.columnRoles() == null ? List.of() : body.columnRoles();
                List<WarningInfo> responseWarnings = body.warnings() == null ? List.of() : body.warnings();

                // 트랜잭션 2 - 결과 저장 + SUCCESS 상태 변경
                jobStateService.saveResultAndMarkSuccess(
                        jobId, dataSourceId, columnRoles, responseWarnings, fileAnalysisRequest
                );
                log.info("[FileAnalysisAsyncService] 파일 분석 완료: dataSourceId={}", dataSource.getId());
                return;

            } catch (ResourceAccessException e) {
                // 네트워크 에러: 재시도
                log.warn("[FileAnalysisAsyncService] 네트워크 에러: jobId={}, attempt={}, msg={}", jobId, attempt, e.getMessage());
                handleRetryOrFail(jobId, attempt, "네트워크 에러: " + e.getMessage());
            } catch (LogueException e) {
                // 2xx 스키마 불일치 - saveResultAndMarkSuccess 롤백 후 여기로
                log.warn("[FileAnalysisAsyncService] 스키마 불일치 - FAILED: jobId={}, msg={}", jobId, e.getMessage());
                jobStateService.markFailed(jobId, "응답 스키마 불일치: " + e.getMessage());
                return;
            } catch (Exception e) {
                log.error("[FileAnalysisAsyncService] 예상치 못한 에러: jobId={}", jobId, e);
                jobStateService.markFailed(jobId, e.getMessage());
                return;
            }
        }
    }

    /**
     * 재시도 가능 여부를 판단하여 RETRYING 상태로 전환하거나 FAILED 처리합니다.
     * attempt == MAX_ATTEMPTS면 재시도 소진으로 FAILED.
     */
    private void handleRetryOrFail(Long jobId, int attempt, String errorMessage) {
        if (attempt == MAX_ATTEMPTS) {
            log.warn("[FileAnalysisAsyncService] 재시도 소진 - FAILED: jobId={}", jobId);
            jobStateService.markFailed(jobId, "재시도 3회 소진: " + errorMessage);
            return;
        }
        jobStateService.markRetrying(jobId, errorMessage);
        sleep(backoffMillis(attempt));
    }

    /** 1s → 2s → 4s, ±30% jitter */
    private long backoffMillis(int attempt) {
        long base = (long) (1000 * Math.pow(2, attempt - 1));
        double jitter = 1.0 + (Math.random() * 0.6 - 0.3); // 0.7 ~ 1.3
        return (long) (base * jitter);
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private FileAnalysisRequest buildRequest(Long jobId, DataSource dataSource) {
        return fileAnalysisRequestBuilder.build(
                jobId,
                dataSource.getId(),
                dataSource.getFileName(),
                dataSource.getRowCount(),
                dataSource.getColumnCount(),
                dataSource.getSchemaJson()
        );
    }
}