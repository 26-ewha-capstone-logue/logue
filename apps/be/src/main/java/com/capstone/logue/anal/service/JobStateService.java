package com.capstone.logue.anal.service;

import com.capstone.logue.anal.dto.fastapi.response.ColumnRoleInfo;
import com.capstone.logue.anal.dto.fastapi.response.WarningInfo;
import com.capstone.logue.anal.dto.fastapi.request.ColumnMetaInfo;
import com.capstone.logue.anal.dto.fastapi.request.FileAnalysisRequest;
import com.capstone.logue.anal.repository.AiTaggingJobRepository;
import com.capstone.logue.anal.repository.DataSourceColumnRepository;
import com.capstone.logue.anal.repository.SourceDataWarningRepository;
import com.capstone.logue.data.repository.DataSourceRepository;
import com.capstone.logue.global.entity.AiTaggingJob;
import com.capstone.logue.global.entity.DataSource;
import com.capstone.logue.global.entity.DataSourceColumn;
import com.capstone.logue.global.entity.SourceDataWarning;
import com.capstone.logue.global.entity.enums.JobStatus;
import com.capstone.logue.global.entity.enums.SourceWarningKey;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * {@link AiTaggingJob} 상태 관리 및 분석 결과 저장을 담당하는 서비스입니다.
 *
 * <p>
 * {@link FileAnalysisAsyncService}에서 FastAPI 호출과 DB 작업을 분리하기 위해
 * 별도 빈으로 분리되었습니다. 각 메서드는 독립적인 트랜잭션으로 실행되어
 * DB 커넥션 점유 시간을 최소화합니다.
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JobStateService {

    private final AiTaggingJobRepository aiTaggingJobRepository;
    private final DataSourceColumnRepository dataSourceColumnRepository;
    private final DataSourceRepository dataSourceRepository;
    private final SourceDataWarningRepository sourceDataWarningRepository;
    private final ObjectMapper objectMapper;

    /**
     * 작업 상태를 RUNNING으로 변경하고, 분석에 필요한 {@link DataSource}를 반환합니다.
     *
     * @param jobId        파일 분석 작업 ID
     * @param dataSourceId 분석 대상 데이터 소스 ID
     * @return 분석 대상 {@link DataSource}
     */
    @Transactional
    public DataSource markRunningAndGetDataSource(Long jobId, Long dataSourceId) {
        AiTaggingJob job = aiTaggingJobRepository.findById(jobId).orElseThrow();
        job.markRunning();

        return dataSourceRepository.findById(dataSourceId).orElseThrow();
    }

    /**
     * 분석 결과(컬럼 역할, 경고)를 저장하고 작업 상태를 SUCCESS로 변경합니다.
     *
     * <p>
     * CANCELED 상태인 경우 결과 저장을 skip합니다.
     * columnRoles에 요청에 없던 컬럼명이 포함된 경우 {@link LogueException}이 발생하며
     * 트랜잭션이 롤백됩니다.
     * </p>
     *
     * @param jobId               파일 분석 작업 ID
     * @param dataSourceId        분석 대상 데이터 소스 ID
     * @param columnRoles         FastAPI가 반환한 컬럼 역할 목록
     * @param responseWarnings    FastAPI가 반환한 경고 목록
     * @param fileAnalysisRequest 원본 분석 요청 DTO (컬럼 메타데이터 조회용)
     * @throws LogueException FastAPI 응답의 컬럼명이 요청에 없는 경우 (COLUMN_NOT_FOUND)
     */
    @Transactional
    public void saveResultAndMarkSuccess(
            Long jobId,
            Long dataSourceId,
            List<ColumnRoleInfo> columnRoles,
            List<WarningInfo> responseWarnings,
            FileAnalysisRequest fileAnalysisRequest
    ) {
        AiTaggingJob job = aiTaggingJobRepository.findById(jobId).orElseThrow();

        // CANCELED 상태면 저장 skip
        if (job.getStatus() == JobStatus.CANCELED) {
            log.info("[JobStateService] 이미 취소된 작업 - 결과 저장 skip: jobId={}", jobId);
            return;
        }

        DataSource dataSource = dataSourceRepository.findById(dataSourceId).orElseThrow();

        List<DataSourceColumn> columns = columnRoles.stream()
                .map(role -> {
                    ColumnMetaInfo meta = fileAnalysisRequest.dataSource().columns().stream()
                            .filter(c -> c.columnName().equals(role.columnName()))
                            .findFirst()
                            .orElseThrow(() -> new LogueException(ErrorCode.COLUMN_NOT_FOUND));

                    return DataSourceColumn.builder()
                            .dataSource(dataSource)
                            .columnName(role.columnName())
                            .dataType(meta.dataType())
                            .nullRatio(meta.nullRatio())
                            .uniqueRatio(meta.uniqueRatio())
                            .sampleValues(objectMapper.valueToTree(meta.sampleValues()))
                            .build();
                })
                .collect(Collectors.toList());

        dataSourceColumnRepository.saveAll(columns);

        List<SourceDataWarning> warnings = responseWarnings.stream()
                .map(w -> {
                    SourceWarningKey key = SourceWarningKey.valueOf(w.code());
                    return SourceDataWarning.builder()
                            .dataSource(dataSource)
                            .code(key)
                            .name(key.getName())
                            .comment(key.getComment())
                            .build();
                })
                .collect(Collectors.toList());

        sourceDataWarningRepository.saveAll(warnings);

        job.markSuccess();
    }

    /**
     * 작업 상태를 FAILED로 변경하고 에러 메시지를 기록합니다.
     *
     * <p>CANCELED 상태인 경우 FAILED 처리를 skip합니다.</p>
     *
     * @param jobId        파일 분석 작업 ID
     * @param errorMessage 실패 원인 메시지
     */
    @Transactional
    public void markFailed(Long jobId, String errorMessage) {
        AiTaggingJob job = aiTaggingJobRepository.findById(jobId).orElseThrow();

        if (job.getStatus() == JobStatus.CANCELED) {
            log.info("[JobStateService] 이미 취소된 작업 - FAILED 처리 skip: jobId={}", jobId);
            return;
        }

        job.markFailed(errorMessage);
    }

    /**
     * 작업 상태를 RETRYING으로 변경하고 에러 메시지를 기록합니다.
     *
     * <p>
     * 5xx 또는 네트워크 에러 발생 시 재시도 직전에 호출됩니다.
     * CANCELED 상태인 경우 RETRYING 처리를 skip합니다.
     * </p>
     *
     * @param jobId        파일 분석 작업 ID
     * @param errorMessage 재시도 원인 메시지
     */
    @Transactional
    public void markRetrying(Long jobId, String errorMessage) {
        AiTaggingJob job = aiTaggingJobRepository.findById(jobId).orElseThrow();

        if (job.getStatus() == JobStatus.CANCELED) {
            log.info("[JobStateService] 이미 취소된 작업 - RETRYING 처리 skip: jobId={}", jobId);
            return;
        }

        job.markRetrying(errorMessage);
        log.info("[JobStateService] RETRYING: jobId={}, retryCount={}", jobId, job.getRetryCount());
    }
}