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
 * {@link AnalService#createAnalysisFlow(Long, com.capstone.logue.anal.dto.request.CreateAnalysisFlowRequest)}
 * 에서 생성된 {@link AiTaggingJob}을 기반으로 FastAPI 파일 분석 API를 호출하고,
 * 응답 결과를 DB에 저장합니다.
 * </p>
 *
 * <p>주요 처리 흐름:</p>
 * <ul>
 *   <li>작업 상태를 RUNNING으로 변경</li>
 *   <li>DataSource 메타데이터 기반 FastAPI 요청 DTO 생성</li>
 *   <li>FastAPI 파일 분석 API 호출</li>
 *   <li>컬럼 역할 분석 결과를 DataSourceColumn으로 저장</li>
 *   <li>데이터 경고 결과를 SourceDataWarning으로 저장</li>
 *   <li>성공 시 SUCCESS, 실패 시 FAILED 상태로 변경</li>
 * </ul>
 *
 * <p>
 * 이 서비스는 {@code @Async}로 실행되므로,
 * API 요청 스레드와 분리된 백그라운드 스레드에서 동작합니다.
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileAnalysisAsyncService {

    private final AiTaggingJobRepository aiTaggingJobRepository;
    private final DataSourceColumnRepository dataSourceColumnRepository;
    private final DataSourceRepository dataSourceRepository;
    private final SourceDataWarningRepository sourceDataWarningRepository;
    private final FileAnalysisRequestBuilder fileAnalysisRequestBuilder;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.base-url}")
    private String fastApiBaseUrl;

    /**
     * FastAPI 파일 분석 요청을 비동기로 수행합니다.
     *
     * <p>
     * 전달받은 jobId와 dataSourceId로 작업 및 데이터 소스를 다시 조회한 뒤,
     * FastAPI에 파일 분석 요청을 보냅니다.
     * 엔티티 객체를 직접 전달하지 않고 ID만 전달하는 이유는
     * 비동기 스레드에서 별도의 트랜잭션과 영속성 컨텍스트를 사용하기 위함입니다.
     * </p>
     *
     * <p>
     * 분석 성공 시 컬럼 분석 결과와 경고 정보를 저장하고 작업 상태를 SUCCESS로 변경합니다.
     * 분석 실패 시 에러 메시지를 기록하고 작업 상태를 FAILED로 변경합니다.
     * </p>
     *
     * @param jobId      파일 분석 작업 ID
     * @param dataSourceId 분석 대상 데이터 소스 ID
     * @param requestId  FastAPI 요청 추적용 ID
     */
    @Async
    @Transactional
    public void analyzeFileAsync(Long jobId, Long dataSourceId, String requestId) {
        AiTaggingJob job = aiTaggingJobRepository.findById(jobId)
                .orElseThrow();

        DataSource dataSource = dataSourceRepository.findById(dataSourceId)
                .orElseThrow();

        try {
            job.markRunning();

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

            if (body != null) {
                List<ColumnRole> columnRoles =
                        body.getColumnRoles() == null ? List.of() : body.getColumnRoles();

                List<Warning> responseWarnings =
                        body.getWarnings() == null ? List.of() : body.getWarnings();

                List<DataSourceColumn> columns = columnRoles.stream()
                        .map(role -> {
                            ColumnMeta meta = fileAnalysisRequest.getDataSource().getColumns().stream()
                                    .filter(c -> c.getColumnName().equals(role.getColumnName()))
                                    .findFirst()
                                    .orElseThrow();

                            return DataSourceColumn.builder()
                                    .dataSource(dataSource)
                                    .columnName(role.getColumnName())
                                    .dataType(meta.getDataType())
                                    .nullRatio(meta.getNullRatio())
                                    .uniqueRatio(meta.getUniqueRatio())
                                    .sampleValues(objectMapper.valueToTree(meta.getSampleValues()))
                                    .build();
                        })
                        .collect(Collectors.toList());

                dataSourceColumnRepository.saveAll(columns);

                List<SourceDataWarning> warnings = responseWarnings.stream()
                        .map(w -> SourceDataWarning.builder()
                                .dataSource(dataSource)
                                .code(SourceWarningKey.valueOf(w.getCode()))
                                .name(SourceWarningKey.valueOf(w.getCode()).getName())
                                .comment(SourceWarningKey.valueOf(w.getCode()).getComment())
                                .build())
                        .collect(Collectors.toList());

                sourceDataWarningRepository.saveAll(warnings);
            }

            job.markSuccess();
            log.info("[FileAnalysisAsyncService] 파일 분석 완료: dataSourceId={}", dataSource.getId());

        } catch (Exception e) {
            log.error("[FileAnalysisAsyncService] 파일 분석 실패: jobId={}, dataSourceId={}",
                    jobId, dataSource.getId(), e);

            job.markFailed(e.getMessage());
        }
    }
}