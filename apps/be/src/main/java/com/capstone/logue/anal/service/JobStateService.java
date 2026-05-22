package com.capstone.logue.anal.service;

import com.capstone.logue.anal.dto.fastapi.response.AnalysisCriteriaInfo;
import com.capstone.logue.anal.dto.fastapi.response.ColumnRoleInfo;
import com.capstone.logue.anal.dto.fastapi.response.FlowColumnInfo;
import com.capstone.logue.anal.dto.fastapi.response.FlowWarningInfo;
import com.capstone.logue.anal.dto.fastapi.response.QuestionAnalysisResponse;
import com.capstone.logue.anal.dto.fastapi.response.WarningInfo;
import com.capstone.logue.anal.dto.fastapi.request.ColumnMetaInfo;
import com.capstone.logue.anal.dto.fastapi.request.FileAnalysisRequest;
import com.capstone.logue.anal.repository.AiTaggingJobRepository;
import com.capstone.logue.anal.repository.AnalysisCriteriaRepository;
import com.capstone.logue.anal.repository.AnalysisFlowColumnRepository;
import com.capstone.logue.anal.repository.DataSourceColumnRepository;
import com.capstone.logue.anal.repository.FlowDataWarningRepository;
import com.capstone.logue.anal.repository.MessageRepository;
import com.capstone.logue.anal.repository.SourceDataWarningRepository;
import com.capstone.logue.data.repository.DataSourceRepository;
import com.capstone.logue.global.entity.AiTaggingJob;
import com.capstone.logue.global.entity.AnalysisCriteria;
import com.capstone.logue.global.entity.AnalysisFlow;
import com.capstone.logue.global.entity.AnalysisFlowColumn;
import com.capstone.logue.global.entity.DataSource;
import com.capstone.logue.global.entity.DataSourceColumn;
import com.capstone.logue.global.entity.FlowDataWarning;
import com.capstone.logue.global.entity.Message;
import com.capstone.logue.global.entity.SourceDataWarning;
import com.capstone.logue.global.entity.enums.AnalysisType;
import com.capstone.logue.global.entity.enums.FlowWarningKey;
import com.capstone.logue.global.entity.enums.JobStatus;
import com.capstone.logue.global.entity.enums.MetricType;
import com.capstone.logue.global.entity.enums.SemanticRoleType;
import com.capstone.logue.global.entity.enums.SourceWarningKey;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private final MessageRepository messageRepository;
    private final AnalysisCriteriaRepository analysisCriteriaRepository;
    private final AnalysisFlowColumnRepository analysisFlowColumnRepository;
    private final FlowDataWarningRepository flowDataWarningRepository;
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

    /**
     * 분석 기준 도출 작업을 RUNNING 으로 변경하고, FastAPI 요청에 필요한 컨텍스트를 묶어 반환합니다.
     *
     * <p>현재 사용자 메시지, 같은 플로우의 이전 메시지, 데이터 소스 및 컬럼 메타데이터,
     * 컬럼별 시맨틱 역할 매핑을 한 번에 로드합니다.</p>
     *
     * @param jobId 분석 기준 도출 작업 ID
     * @return FastAPI 요청 빌드용 {@link CriteriaJobContext}
     */
    @Transactional
    public CriteriaJobContext markCriteriaRunningAndGetContext(Long jobId) {
        AiTaggingJob job = aiTaggingJobRepository.findById(jobId)
                .orElseThrow(() -> new LogueException(ErrorCode.JOB_NOT_FOUND));
        job.markRunning();

        Message currentMessage = job.getMessage();
        if (currentMessage == null) {
            throw new LogueException(ErrorCode.MESSAGE_NOT_FOUND);
        }
        AnalysisFlow flow = job.getAnalysisFlow();
        DataSource dataSource = flow.getDataSource();

        List<DataSourceColumn> columns = dataSourceColumnRepository.findByDataSourceId(dataSource.getId());
        List<AnalysisFlowColumn> flowColumns = analysisFlowColumnRepository.findByAnalysisFlowIdOrderByIdAsc(flow.getId());

        List<Message> previousMessages = messageRepository
                .findByAnalysisFlowIdOrderByCreatedAtAscIdAsc(flow.getId())
                .stream()
                .filter(m -> !m.getId().equals(currentMessage.getId()))
                .collect(Collectors.toList());

        return new CriteriaJobContext(currentMessage, flow, dataSource, columns, flowColumns, previousMessages);
    }

    /**
     * FastAPI 가 반환한 분석 기준 + 플로우 컬럼 + 경고를 영속화하고 작업을 SUCCESS 로 변경합니다.
     *
     * <p>{@code unsupportedQuestion} 이 존재하면 분석 기준을 저장하지 않고 즉시 FAILED 로 마킹합니다.
     * CANCELED 상태인 경우 저장을 skip 합니다.
     * {@code flowColumns} 에 데이터 소스에 없는 컬럼명이 포함되면 {@link ErrorCode#COLUMN_NOT_FOUND} 예외가 발생하며
     * 트랜잭션이 롤백됩니다.</p>
     *
     * @param jobId    분석 기준 도출 작업 ID
     * @param response FastAPI 응답
     */
    @Transactional
    public void saveCriteriaAndMarkSuccess(Long jobId, QuestionAnalysisResponse response) {
        AiTaggingJob job = aiTaggingJobRepository.findById(jobId).orElseThrow();

        if (job.getStatus() == JobStatus.CANCELED) {
            log.info("[JobStateService] 이미 취소된 분석 기준 작업 - 결과 저장 skip: jobId={}", jobId);
            return;
        }

        if (response.unsupportedQuestion() != null) {
            log.info("[JobStateService] 지원하지 않는 질문 유형: jobId={}, reason={}", jobId, response.unsupportedQuestion().reason());
            job.markFailed("UNSUPPORTED_QUESTION: " + response.unsupportedQuestion().reason());
            return;
        }

        AnalysisCriteriaInfo criteriaInfo = response.analysisCriteria();
        if (criteriaInfo == null) {
            throw new LogueException(ErrorCode.LLM_CALL_FAILED);
        }

        AnalysisFlow flow = job.getAnalysisFlow();

        AnalysisCriteria criteria = AnalysisCriteria.builder()
                .analysisFlow(flow)
                .analysisType(AnalysisType.valueOf(criteriaInfo.analysisType()))
                .metricName(criteriaInfo.metricName())
                .metricType(MetricType.valueOf(criteriaInfo.metricType()))
                .formulaNumerator(criteriaInfo.formulaNumerator())
                .formulaDenominator(criteriaInfo.formulaDenominator())
                .baseDateColumn(criteriaInfo.baseDateColumn())
                .standardPeriod(criteriaInfo.standardPeriod())
                .comparePeriod(criteriaInfo.comparePeriod())
                .sortBy(criteriaInfo.sortBy())
                .sortDirection(criteriaInfo.sortDirection())
                .groupBy(objectMapper.valueToTree(criteriaInfo.groupBy()))
                .limitNum(criteriaInfo.limitNum())
                .filters(criteriaInfo.filters() == null ? null : objectMapper.valueToTree(criteriaInfo.filters()))
                .dataWarnings(response.warnings() == null || response.warnings().isEmpty()
                        ? null
                        : objectMapper.valueToTree(response.warnings()))
                .isConfirmed(false)
                .build();

        AnalysisCriteria savedCriteria = analysisCriteriaRepository.save(criteria);

        List<FlowColumnInfo> flowColumns = response.flowColumns() == null ? List.of() : response.flowColumns();
        if (!flowColumns.isEmpty()) {
            Map<String, DataSourceColumn> columnByName = new HashMap<>();
            for (DataSourceColumn col : dataSourceColumnRepository.findByDataSourceId(flow.getDataSource().getId())) {
                columnByName.put(col.getColumnName(), col);
            }
            for (FlowColumnInfo fc : flowColumns) {
                DataSourceColumn dsColumn = columnByName.get(fc.columnName());
                if (dsColumn == null) {
                    throw new LogueException(ErrorCode.COLUMN_NOT_FOUND);
                }
                AnalysisFlowColumn afc = AnalysisFlowColumn.builder()
                        .analysisFlow(flow)
                        .dataSourceColumn(dsColumn)
                        .semanticRole(SemanticRoleType.valueOf(fc.semanticRole()))
                        .build();
                analysisFlowColumnRepository.save(afc);
            }
        }

        List<FlowWarningInfo> warnings = response.warnings() == null ? List.of() : response.warnings();
        for (FlowWarningInfo w : warnings) {
            FlowWarningKey key;
            try {
                key = FlowWarningKey.valueOf(w.code());
            } catch (IllegalArgumentException e) {
                log.warn("[JobStateService] 알 수 없는 FlowWarningKey 무시: code={}", w.code());
                continue;
            }
            FlowDataWarning warning = FlowDataWarning.builder()
                    .analysisCriteria(savedCriteria)
                    .code(key)
                    .name(key.getName())
                    .comment(key.getComment())
                    .build();
            flowDataWarningRepository.save(warning);
        }

        job.markSuccess();
    }
}