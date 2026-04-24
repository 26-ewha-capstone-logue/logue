package com.capstone.logue.anal.service;

import com.capstone.logue.anal.client.FastApiClient;
import com.capstone.logue.anal.dto.request.CreateAnalysisFlowRequest;
import com.capstone.logue.anal.dto.response.*;
import com.capstone.logue.anal.repository.*;
import com.capstone.logue.data.repository.DataSourceRepository;
import com.capstone.logue.auth.provider.SecurityContextProvider;
import com.capstone.logue.global.entity.*;
import com.capstone.logue.global.entity.enums.JobStage;
import com.capstone.logue.global.entity.enums.JobStatus;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.capstone.logue.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;


/**
 * 분석 대화 흐름 관련 비즈니스 로직을 처리하는 서비스입니다.
 *
 * <p>
 * 대화 생성, AnalysisFlow 생성, 파일 분석 작업 시작,
 * 데이터 상태 요약 조회/폴링/취소 기능을 제공합니다.
 * </p>
 *
 * <p>
 * 파일 분석은 FastAPI 응답을 기다리지 않고 비동기 작업으로 분리됩니다.
 * 따라서 AnalysisFlow 생성 요청은 즉시 응답을 반환하고,
 * 실제 분석 진행 상태는 AiTaggingJob을 통해 추적합니다.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnalService {

    private final ConversationRepository conversationRepository;
    private final AnalysisFlowRepository analysisFlowRepository;
    private final DataSourceRepository dataSourceRepository;
    private final DataSourceColumnRepository dataSourceColumnRepository;
    private final SourceDataWarningRepository sourceDataWarningRepository;
    private final AiTaggingJobRepository aiTaggingJobRepository;
    private final UserRepository userRepository;
    private final FileAnalysisAsyncService fileAnalysisAsyncService;
    private final FastApiClient fastApiClient;
    private final ObjectMapper objectMapper;

    @Value("${ai.base-url}")
    private String fastApiBaseUrl;

    /**
     * 새로운 분석 대화를 생성합니다.
     *
     * <p>Conversation 엔티티를 저장하고 생성된 대화 ID와 생성 시각을 반환합니다.</p>
     *
     * @return 생성된 대화 정보 (conversationId, createdAt)
     * @throws LogueException 파일을 찾을 수 없는 경우 (D001), 서버 내부 오류 발생 시 (C004)
     */
    public CreateConversationResponse createConversation(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new LogueException(ErrorCode.USER_NOT_FOUND));

        Conversation conversation = Conversation.builder()
                .user(user)
                .title("새 대화")   // TODO: 제목 정책 논의 필요
                .build();

        Conversation saved = conversationRepository.save(conversation);

        return CreateConversationResponse.builder()
                .conversationId(saved.getId())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    /**
     * 지정된 대화에 새로운 AnalysisFlow를 생성하고 파일 분석 비동기 작업을 시작합니다.
     *
     * <p>
     * 요청받은 dataSourceId를 기반으로 AnalysisFlow를 생성한 뒤,
     * DATA_STATUS 단계의 AiTaggingJob을 QUEUED 상태로 저장합니다.
     * 이후 FastAPI 파일 분석 호출은 {@link FileAnalysisAsyncService}에서 비동기로 수행됩니다.
     * </p>
     *
     * <p>
     * 이 메서드는 FastAPI 분석 결과를 기다리지 않고,
     * 생성된 AnalysisFlow 정보만 즉시 반환합니다.
     * 클라이언트는 별도의 상태 조회 API를 통해 분석 진행 상태를 폴링해야 합니다.
     * </p>
     *
     * @param conversationId 대화 ID
     * @param request        dataSourceId를 포함한 요청 DTO
     * @return 생성된 AnalysisFlow 정보 (analysisFlowId, dataSourceId, createdAt)
     * @throws LogueException 대화를 찾을 수 없는 경우(CV001), 데이터 소스를 찾을 수 없는 경우(D001)
     */
    public CreateAnalysisFlowResponse createAnalysisFlow(
            Long conversationId, CreateAnalysisFlowRequest request) {

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new LogueException(ErrorCode.CONVERSATION_NOT_FOUND));

        DataSource dataSource = dataSourceRepository.findById(request.getDataSourceId())
                .orElseThrow(() -> new LogueException(ErrorCode.DATASOURCE_NOT_FOUND));

        AnalysisFlow analysisFlow = AnalysisFlow.builder()
                .conversation(conversation)
                .dataSource(dataSource)
                .build();

        AnalysisFlow saved = analysisFlowRepository.save(analysisFlow);

        String requestId = UUID.randomUUID().toString();

        AiTaggingJob job = AiTaggingJob.builder()
                .conversation(conversation)
                .analysisFlow(saved)
                .stage(JobStage.DATA_STATUS)
                .status(JobStatus.QUEUED)
                .startedAt(OffsetDateTime.now())
                .build();

        AiTaggingJob savedJob = aiTaggingJobRepository.save(job);

        JsonNode payload = objectMapper.valueToTree(Map.of(
                "requestId", savedJob.getId(),   // jobId = requestId
                "dataSourceId", dataSource.getId(),
                "fileName", dataSource.getFileName()
        ));
        savedJob.setRequestPayload(payload);
        aiTaggingJobRepository.save(savedJob);

        fileAnalysisAsyncService.analyzeFileAsync(
                savedJob.getId(),
                dataSource.getId()
        );

        return CreateAnalysisFlowResponse.builder()
                .analysisFlowId(saved.getId())
                .dataSourceId(request.getDataSourceId())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    /**
     * 분석 흐름의 데이터 상태 요약 결과를 조회합니다.
     *
     * <p>
     * 해당 AnalysisFlow에 연결된 DATA_STATUS 단계의 {@link AiTaggingJob} 상태를 확인한 후,
     * 분석이 완료된 경우(DB에 저장된 결과 기반으로) 요약 정보를 반환합니다.
     * </p>
     *
     * <p>
     * 파일 분석은 비동기로 수행되므로, 작업 상태가 {@link JobStatus#SUCCESS}가 아닐 경우
     * 요약 결과를 조회할 수 없으며 예외가 발생합니다.
     * </p>
     *
     * <p>
     * 현재 구현에서는 FastAPI 응답을 직접 반환하지 않고,
     * {@link DataSourceColumn} 및 {@link SourceDataWarning} 테이블에 저장된 값을 기반으로
     * 요약 정보를 구성합니다.
     * </p>
     *
     * @param conversationId 대화 ID
     * @param analysisFlowId 분석 흐름 ID
     * @return 데이터 상태 요약 결과 (컬럼 정보, 경고 메시지 등)
     * @throws LogueException 분석 흐름 또는 데이터 소스를 찾을 수 없는 경우 (D001),
     *                        요약이 아직 완료되지 않은 경우 (D101)
     */
    public GetSummaryResponse getSummary(Long conversationId, Long analysisFlowId) {
        AnalysisFlow analysisFlow = analysisFlowRepository.findById(analysisFlowId)
                .orElseThrow(() -> new LogueException(ErrorCode.DATASOURCE_NOT_FOUND));

        AiTaggingJob job = aiTaggingJobRepository
                .findTopByConversationIdAndStageOrderByCreatedAtDesc(analysisFlowId, JobStage.DATA_STATUS)
                .orElseThrow(() -> new LogueException(ErrorCode.JOB_NOT_FOUND));

        if (job.getStatus() != JobStatus.SUCCESS) {
            throw new LogueException(ErrorCode.SUMMARY_NOT_COMPLETED);
        }

        DataSource dataSource = analysisFlow.getDataSource();

        List<DataSourceColumn> columns =
                dataSourceColumnRepository.findByDataSourceId(dataSource.getId());

        List<SourceDataWarning> warnings =
                sourceDataWarningRepository.findByDataSourceId(dataSource.getId());

        List<String> columnNames = columns.stream()
                .map(DataSourceColumn::getColumnName)
                .toList();

        String warningMessage = warnings.isEmpty()
                ? null
                : warnings.get(0).getComment(); // 일단 하나만

        return GetSummaryResponse.builder()
                .rowCount(dataSource.getRowCount())
                .columnCount(dataSource.getColumnCount())

                // TODO: ⚠️ 임시 매핑 (나중에 AI 결과 구조 반영 필요)
                .dataCriteria(columnNames)
                .measure(List.of())
                .dimension(List.of())
                .statusCondition(List.of())
                .flag(List.of())
                .idCriteria(List.of())

                .sourceDataWarning(warningMessage)
                .createdAt(dataSource.getCreatedAt().toLocalDateTime())
                .build();
    }

    /**
     * 데이터 상태 요약 생성의 진행 상태를 조회합니다.
     *
     * <p>
     * AnalysisFlow와 연결된 DATA_STATUS 단계의 AiTaggingJob 상태를 조회하여 반환합니다.
     * 상태값은 QUEUED, RUNNING, SUCCESS, FAILED, CANCELED 중 하나입니다.
     * </p>
     *
     * @param conversationId 대화 ID
     * @param analysisFlowId 분석 흐름 ID
     * @return 현재 요약 생성 상태
     * @throws LogueException 분석 흐름을 찾을 수 없는 경우
     */
    public GetSummaryStatusResponse getSummaryStatus(Long conversationId, Long analysisFlowId) {
        analysisFlowRepository.findById(analysisFlowId)
                .orElseThrow(() -> new LogueException(ErrorCode.DATASOURCE_NOT_FOUND));

        AiTaggingJob job = aiTaggingJobRepository
                .findTopByConversationIdAndStageOrderByCreatedAtDesc(analysisFlowId, JobStage.DATA_STATUS)
                .orElseThrow(() -> new LogueException(ErrorCode.INTERNAL_SERVER_ERROR));

        return GetSummaryStatusResponse.builder()
                .status(job.getStatus().name())
                .build();
    }

    /**
     * 진행 중인 데이터 상태 요약 생성을 취소합니다.
     *
     * <p>현재 QUEUED 또는 RUNNING 상태인 요약 생성 작업을 취소하고 CANCELLED 상태를 반환합니다.</p>
     *
     * @param conversationId 대화 ID
     * @param analysisFlowId 분석 흐름 ID
     * @return 취소 결과 (status: CANCELLED)
     * @throws LogueException 파일을 찾을 수 없는 경우 (D001), 요약이 시작되지 않은 경우 (D102)
     */
    public CancelSummaryResponse cancelSummary(Long conversationId, Long analysisFlowId) {
        analysisFlowRepository.findById(analysisFlowId)
                .orElseThrow(() -> new LogueException(ErrorCode.DATASOURCE_NOT_FOUND));

        AiTaggingJob job = aiTaggingJobRepository
                .findTopByConversationIdAndStageOrderByCreatedAtDesc(analysisFlowId, JobStage.DATA_STATUS)
                .orElseThrow(() -> new LogueException(ErrorCode.INTERNAL_SERVER_ERROR));

        if (job.getStatus() != JobStatus.QUEUED && job.getStatus() != JobStatus.RUNNING) {
            throw new LogueException(ErrorCode.SUMMARY_NOT_STARTED);
        }

        job.markCanceled();
        aiTaggingJobRepository.save(job);

        // FastAPI 취소 요청
        try {
            fastApiClient.cancelAnalysis(job.getId());
        } catch (Exception e) {
            log.warn("[AnalService] FastAPI 취소 요청 실패 (무시): conversationId={}", conversationId, e);
        }

        return CancelSummaryResponse.builder()
                .status("CANCELLED")
                .build();
    }
}
