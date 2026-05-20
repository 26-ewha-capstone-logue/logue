package com.capstone.logue.anal.service;

import com.capstone.logue.anal.client.FastApiClient;
import com.capstone.logue.anal.dto.spring.request.CreateQuestionRequest;
import com.capstone.logue.anal.dto.spring.request.UpdateQuestionCriteriaRequest;
import com.capstone.logue.anal.dto.spring.response.CancelQuestionCriteriaResponse;
import com.capstone.logue.anal.dto.spring.response.CreateQuestionResponse;
import com.capstone.logue.anal.dto.spring.response.GetQuestionCriteriaResponse;
import com.capstone.logue.anal.dto.spring.response.GetQuestionCriteriaStatusResponse;
import com.capstone.logue.anal.dto.spring.response.UpdateQuestionCriteriaResponse;
import com.capstone.logue.anal.repository.AiTaggingJobRepository;
import com.capstone.logue.anal.repository.AnalysisCriteriaRepository;
import com.capstone.logue.anal.repository.AnalysisFlowRepository;
import com.capstone.logue.anal.repository.ConversationRepository;
import com.capstone.logue.anal.repository.FlowDataWarningRepository;
import com.capstone.logue.anal.repository.MessageRepository;
import com.capstone.logue.auth.provider.SecurityContextProvider;
import com.capstone.logue.global.entity.AiTaggingJob;
import com.capstone.logue.global.entity.AnalysisCriteria;
import com.capstone.logue.global.entity.AnalysisFlow;
import com.capstone.logue.global.entity.Conversation;
import com.capstone.logue.global.entity.FlowDataWarning;
import com.capstone.logue.global.entity.Message;
import com.capstone.logue.global.entity.enums.JobStage;
import com.capstone.logue.global.entity.enums.JobStatus;
import com.capstone.logue.global.entity.enums.MessageRole;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * 질문 분석 플로우(분석 기준 도출/조회/수정/취소/상태폴링)의 비즈니스 로직을 담당합니다.
 *
 * <p>비동기 FastAPI 호출은 {@link QuestionAnalysisAsyncService} 에 위임합니다.
 * 상태/결과 영속화는 {@link JobStateService} 에 위임합니다.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionCriteriaService {

    private final ConversationRepository conversationRepository;
    private final AnalysisFlowRepository analysisFlowRepository;
    private final AiTaggingJobRepository aiTaggingJobRepository;
    private final MessageRepository messageRepository;
    private final AnalysisCriteriaRepository analysisCriteriaRepository;
    private final FlowDataWarningRepository flowDataWarningRepository;
    private final SecurityContextProvider securityContextProvider;
    private final QuestionAnalysisAsyncService questionAnalysisAsyncService;
    private final FastApiClient fastApiClient;
    private final ObjectMapper objectMapper;

    private static final String MESSAGE_CRITERIA_READY =
            "질문 분석이 완료되었어요. 아래 분석 기준으로 검증을 진행해도 될까요?";
    private static final String MESSAGE_CRITERIA_NEED_CONFIRM =
            "질문 분석이 완료되었어요. 문제가 있는 부분은 임의로 넣어보았으니 꼭 확인해주세요.";

    /**
     * 사용자 질문을 메시지로 저장하고 분석 기준 도출 비동기 작업을 트리거합니다.
     *
     * @param conversationId 대화 ID
     * @param analysisFlowId 분석 흐름 ID
     * @param request        질문 내용
     * @return 생성된 메시지 정보
     */
    @Transactional
    public CreateQuestionResponse createQuestion(
            Long conversationId, Long analysisFlowId, CreateQuestionRequest request) {

        AnalysisFlow flow = validateAccess(conversationId, analysisFlowId);

        AiTaggingJob latestDataStatusJob = aiTaggingJobRepository
                .findTopByAnalysisFlowIdAndStageOrderByCreatedAtDescIdDesc(analysisFlowId, JobStage.DATA_STATUS)
                .orElseThrow(() -> new LogueException(ErrorCode.DATASOURCE_NOT_READY));
        if (latestDataStatusJob.getStatus() != JobStatus.SUCCESS) {
            throw new LogueException(ErrorCode.DATASOURCE_NOT_READY);
        }

        Message message = Message.builder()
                .analysisFlow(flow)
                .role(MessageRole.USER)
                .content(request.question())
                .build();
        Message savedMessage = messageRepository.save(message);

        AiTaggingJob job = AiTaggingJob.builder()
                .conversation(flow.getConversation())
                .analysisFlow(flow)
                .message(savedMessage)
                .stage(JobStage.ANALYSIS_CRITERIA)
                .status(JobStatus.QUEUED)
                .build();
        AiTaggingJob savedJob = aiTaggingJobRepository.save(job);

        questionAnalysisAsyncService.resolveCriteriaAsync(savedJob.getId(), savedMessage.getContent());

        return new CreateQuestionResponse(
                savedMessage.getId(),
                savedMessage.getContent(),
                savedMessage.getCreatedAt()
        );
    }

    /**
     * 분석 기준 도출 결과를 조회합니다.
     *
     * @param conversationId 대화 ID
     * @param analysisFlowId 분석 흐름 ID
     * @param messageId      사용자 메시지 ID
     * @return 분석 기준 + 데이터 경고 + 사용자 확인 필요 필드 목록
     */
    @Transactional(readOnly = true)
    public GetQuestionCriteriaResponse getCriteria(
            Long conversationId, Long analysisFlowId, Long messageId) {

        AnalysisFlow flow = validateAccess(conversationId, analysisFlowId);
        Message message = loadMessage(flow, messageId);

        AiTaggingJob job = aiTaggingJobRepository
                .findTopByMessageIdAndStageOrderByCreatedAtDescIdDesc(messageId, JobStage.ANALYSIS_CRITERIA)
                .orElseThrow(() -> new LogueException(ErrorCode.CRITERIA_NOT_FOUND));

        if (job.getStatus() != JobStatus.SUCCESS) {
            throw new LogueException(ErrorCode.CRITERIA_NOT_COMPLETED);
        }

        AnalysisCriteria criteria = analysisCriteriaRepository
                .findTopByAnalysisFlowIdOrderByCreatedAtDescIdDesc(flow.getId())
                .orElseThrow(() -> new LogueException(ErrorCode.CRITERIA_NOT_FOUND));

        List<FlowDataWarning> warnings = flowDataWarningRepository
                .findByAnalysisCriteriaId(criteria.getId());

        List<GetQuestionCriteriaResponse.DataWarningItem> warningItems = new ArrayList<>();
        int order = 1;
        for (FlowDataWarning w : warnings) {
            warningItems.add(new GetQuestionCriteriaResponse.DataWarningItem(order++, w.getComment()));
        }

        List<String> needConfirm = extractNeedConfirm(criteria.getDataWarnings());

        GetQuestionCriteriaResponse.CriteriaInfo criteriaInfo = new GetQuestionCriteriaResponse.CriteriaInfo(
                criteria.getAnalysisType().name(),
                criteria.getMetricName(),
                criteria.getBaseDateColumn(),
                criteria.getStandardPeriod(),
                criteria.getComparePeriod(),
                jsonNodeToStringList(criteria.getGroupBy()),
                criteria.getSortBy(),
                criteria.getSortDirection(),
                criteria.getLimitNum(),
                jsonNodeToFilters(criteria.getFilters()),
                warningItems,
                needConfirm
        );

        String userMessage = warnings.isEmpty() ? MESSAGE_CRITERIA_READY : MESSAGE_CRITERIA_NEED_CONFIRM;

        return new GetQuestionCriteriaResponse(
                message.getId(),
                message.getContent(),
                userMessage,
                criteriaInfo,
                criteria.getCreatedAt()
        );
    }

    /**
     * 분석 기준을 수정하거나 확정합니다.
     *
     * @param conversationId 대화 ID
     * @param analysisFlowId 분석 흐름 ID
     * @param messageId      사용자 메시지 ID
     * @param request        수정 요청
     * @return 분석 기준 ID + 확정 시각 (확정되지 않은 경우 null)
     */
    @Transactional
    public UpdateQuestionCriteriaResponse updateCriteria(
            Long conversationId, Long analysisFlowId, Long messageId,
            UpdateQuestionCriteriaRequest request) {

        AnalysisFlow flow = validateAccess(conversationId, analysisFlowId);
        loadMessage(flow, messageId);

        AnalysisCriteria criteria = analysisCriteriaRepository
                .findTopByAnalysisFlowIdOrderByCreatedAtDescIdDesc(flow.getId())
                .orElseThrow(() -> new LogueException(ErrorCode.CRITERIA_NOT_FOUND));

        if (Boolean.TRUE.equals(criteria.getIsConfirmed()) && request.confirmed()) {
            throw new LogueException(ErrorCode.CRITERIA_ALREADY_CONFIRMED);
        }

        applyUpdate(criteria, request);
        analysisCriteriaRepository.save(criteria);

        return new UpdateQuestionCriteriaResponse(criteria.getId(), criteria.getConfirmedAt());
    }

    /**
     * 진행 중인 분석 기준 도출 작업을 취소합니다.
     *
     * @param conversationId 대화 ID
     * @param analysisFlowId 분석 흐름 ID
     * @param messageId      사용자 메시지 ID
     * @return 취소 결과 (status: CANCELLED)
     */
    @Transactional
    public CancelQuestionCriteriaResponse cancelCriteria(
            Long conversationId, Long analysisFlowId, Long messageId) {

        AnalysisFlow flow = validateAccess(conversationId, analysisFlowId);
        loadMessage(flow, messageId);

        AiTaggingJob job = aiTaggingJobRepository
                .findTopByMessageIdAndStageOrderByCreatedAtDescIdDesc(messageId, JobStage.ANALYSIS_CRITERIA)
                .orElseThrow(() -> new LogueException(ErrorCode.CRITERIA_NOT_FOUND));

        JobStatus status = job.getStatus();
        boolean cancellable = status == JobStatus.QUEUED
                || status == JobStatus.RUNNING
                || status == JobStatus.RETRYING;
        if (!cancellable) {
            throw new LogueException(ErrorCode.CRITERIA_NOT_STARTED);
        }

        job.markCanceled();
        aiTaggingJobRepository.save(job);

        try {
            fastApiClient.cancelAnalysis(job.getId());
        } catch (Exception e) {
            log.warn("[QuestionCriteriaService] FastAPI 분석 기준 취소 요청 실패 (무시): jobId={}", job.getId(), e);
        }

        return new CancelQuestionCriteriaResponse("CANCELLED");
    }

    /**
     * 분석 기준 도출 작업 상태를 조회합니다.
     *
     * @param conversationId 대화 ID
     * @param analysisFlowId 분석 흐름 ID
     * @param messageId      사용자 메시지 ID
     * @return 현재 작업 상태 문자열
     */
    @Transactional(readOnly = true)
    public GetQuestionCriteriaStatusResponse getCriteriaStatus(
            Long conversationId, Long analysisFlowId, Long messageId) {

        AnalysisFlow flow = validateAccess(conversationId, analysisFlowId);
        loadMessage(flow, messageId);

        AiTaggingJob job = aiTaggingJobRepository
                .findTopByMessageIdAndStageOrderByCreatedAtDescIdDesc(messageId, JobStage.ANALYSIS_CRITERIA)
                .orElseThrow(() -> new LogueException(ErrorCode.CRITERIA_NOT_FOUND));

        return new GetQuestionCriteriaStatusResponse(job.getStatus().name());
    }

    /**
     * 대화 소유권 + 플로우 소속 + (선택) 메시지 소속을 검증합니다.
     */
    private AnalysisFlow validateAccess(Long conversationId, Long analysisFlowId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new LogueException(ErrorCode.CONVERSATION_NOT_FOUND));

        Long currentUserId = securityContextProvider.getAuthenticatedUser().userId();
        if (!conversation.getUser().getId().equals(currentUserId)) {
            throw new LogueException(ErrorCode.FORBIDDEN);
        }

        AnalysisFlow flow = analysisFlowRepository.findById(analysisFlowId)
                .orElseThrow(() -> new LogueException(ErrorCode.DATASOURCE_NOT_FOUND));

        if (!flow.getConversation().getId().equals(conversationId)) {
            throw new LogueException(ErrorCode.FORBIDDEN);
        }

        return flow;
    }

    private Message loadMessage(AnalysisFlow flow, Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new LogueException(ErrorCode.MESSAGE_NOT_FOUND));
        if (!message.getAnalysisFlow().getId().equals(flow.getId())) {
            throw new LogueException(ErrorCode.FORBIDDEN);
        }
        return message;
    }

    private void applyUpdate(AnalysisCriteria criteria, UpdateQuestionCriteriaRequest request) {
        JsonNode groupByNode = request.groupBy() == null ? null : objectMapper.valueToTree(request.groupBy());
        JsonNode filtersNode = request.filters() == null ? null : objectMapper.valueToTree(request.filters());

        criteria.applyUserUpdate(
                request.baseDateColumn(),
                request.standardPeriod(),
                request.comparePeriod(),
                request.sortBy(),
                request.sortDirection(),
                request.limitNum(),
                groupByNode,
                filtersNode
        );

        if (request.confirmed() && !Boolean.TRUE.equals(criteria.getIsConfirmed())) {
            criteria.confirm();
        }
    }

    private List<String> jsonNodeToStringList(JsonNode node) {
        if (node == null || !node.isArray()) return List.of();
        List<String> result = new ArrayList<>();
        node.forEach(n -> result.add(n.asText()));
        return result;
    }

    private List<GetQuestionCriteriaResponse.FilterInfo> jsonNodeToFilters(JsonNode node) {
        if (node == null || !node.isArray()) return List.of();
        List<GetQuestionCriteriaResponse.FilterInfo> result = new ArrayList<>();
        for (JsonNode item : node) {
            String field = item.path("field").asText(null);
            String operator = item.path("operator").asText(null);
            JsonNode value = item.path("value");
            result.add(new GetQuestionCriteriaResponse.FilterInfo(field, operator, value));
        }
        return result;
    }

    private List<String> extractNeedConfirm(JsonNode dataWarnings) {
        if (dataWarnings == null || !dataWarnings.isArray()) return List.of();
        Set<String> result = new LinkedHashSet<>();
        for (JsonNode warning : dataWarnings) {
            JsonNode related = warning.path("relatedFields");
            if (related.isArray()) {
                related.forEach(f -> {
                    String v = f.asText(null);
                    if (v != null && !v.isBlank()) result.add(v);
                });
            }
        }
        return new ArrayList<>(result);
    }
}
