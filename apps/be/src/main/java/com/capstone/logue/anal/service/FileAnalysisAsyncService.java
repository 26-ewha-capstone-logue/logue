package com.capstone.logue.anal.service;

import com.capstone.logue.anal.dto.fastapi.ColumnRole;
import com.capstone.logue.anal.dto.fastapi.FileAnalysisResponse;
import com.capstone.logue.anal.dto.fastapi.Warning;
import com.capstone.logue.anal.dto.request.ColumnMeta;
import com.capstone.logue.anal.dto.request.FileAnalysisRequest;
import com.capstone.logue.anal.repository.AiTaggingJobRepository;
import com.capstone.logue.anal.repository.DataSourceColumnRepository;
import com.capstone.logue.anal.repository.SourceDataWarningRepository;
import com.capstone.logue.data.repository.DataSourceRepository;
import com.capstone.logue.global.entity.AiTaggingJob;
import com.capstone.logue.global.entity.DataSource;
import com.capstone.logue.global.entity.DataSourceColumn;
import com.capstone.logue.global.entity.SourceDataWarning;
import com.capstone.logue.global.entity.enums.SourceWarningKey;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.stream.Collectors;

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

    private final JobStateService jobStateService;
    private final FileAnalysisRequestBuilder fileAnalysisRequestBuilder;
    private final RestTemplate restTemplate;

    @Value("${ai.base-url}")
    private String fastApiBaseUrl;

    /**
     * FastAPI 파일 분석 요청을 비동기로 수행합니다.
     * 이 메서드 자체에는 @Transactional을 걸지 않습니다.
     * DB 커넥션은 JobStateService의 각 메서드 안에서만 점유됩니다.
     *
     * @param jobId      파일 분석 작업 ID
     * @param dataSourceId 분석 대상 데이터 소스 ID
     * @param requestId  FastAPI 요청 추적용 ID
     */
    @Async
    @Transactional
    public void analyzeFileAsync(Long jobId, Long dataSourceId, String requestId) {

        // 트랜잭션 1 - RUNNING 상태 변경 + DataSource 조회
        DataSource dataSource = jobStateService.markRunningAndGetDataSource(jobId, dataSourceId);

        try {
            // 트랜잭션 없음 - FastAPI 호출 (수십 초 소요 가능)
            FileAnalysisRequest fileAnalysisRequest = fileAnalysisRequestBuilder.build(
                    requestId,
                    dataSource.getId(),
                    dataSource.getFileName(),
                    dataSource.getRowCount(),
                    dataSource.getColumnCount(),
                    dataSource.getSchemaJson()
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<FileAnalysisRequest> entity =
                    new HttpEntity<>(fileAnalysisRequest, headers);

            ResponseEntity<FileAnalysisResponse> response = restTemplate.exchange(
                    fastApiBaseUrl + "/v1/llm/data-sources/analyze",
                    HttpMethod.POST,
                    entity,
                    FileAnalysisResponse.class
            );

            FileAnalysisResponse body = response.getBody();

            List<ColumnRole> columnRoles = (body == null || body.getColumnRoles() == null)
                    ? List.of() : body.getColumnRoles();
            List<Warning> responseWarnings = (body == null || body.getWarnings() == null)
                    ? List.of() : body.getWarnings();

            // 트랜잭션 2 - 결과 저장 + SUCCESS 상태 변경
            jobStateService.saveResultAndMarkSuccess(
                    jobId, dataSourceId, columnRoles, responseWarnings, fileAnalysisRequest
            );
            log.info("[FileAnalysisAsyncService] 파일 분석 완료: dataSourceId={}", dataSource.getId());

        } catch (Exception e) {
            log.error("[FileAnalysisAsyncService] 파일 분석 실패: jobId={}, dataSourceId={}",
                    jobId, dataSource.getId(), e);

            // 트랜잭션 3 - FAILED 상태 변경
            jobStateService.markFailed(jobId, e.getMessage());
        }
    }
}