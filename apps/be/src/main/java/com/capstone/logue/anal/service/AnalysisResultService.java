package com.capstone.logue.anal.service;

import com.capstone.logue.anal.client.FastApiClient;
import com.capstone.logue.anal.dto.spring.response.CancelQuestionResultResponse;
import com.capstone.logue.anal.dto.spring.response.GetQuestionResultResponse;
import com.capstone.logue.anal.dto.spring.response.GetQuestionResultStatusResponse;
import com.capstone.logue.anal.repository.AiTaggingJobRepository;
import com.capstone.logue.anal.repository.AnalysisCriteriaRepository;
import com.capstone.logue.anal.repository.AnalysisFlowRepository;
import com.capstone.logue.anal.repository.AnalysisResultRepository;
import com.capstone.logue.anal.repository.ConversationRepository;
import com.capstone.logue.anal.repository.MessageRepository;
import com.capstone.logue.auth.provider.SecurityContextProvider;
import com.capstone.logue.global.entity.AiTaggingJob;
import com.capstone.logue.global.entity.AnalysisCriteria;
import com.capstone.logue.global.entity.AnalysisFlow;
import com.capstone.logue.global.entity.AnalysisResult;
import com.capstone.logue.global.entity.Conversation;
import com.capstone.logue.global.entity.Message;
import com.capstone.logue.global.entity.enums.JobStage;
import com.capstone.logue.global.entity.enums.JobStatus;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * 최종 분석 결과 조회/상태 폴링/취소 비즈니스 로직을 담당합니다.
 *
 * <p>결과 도출 트리거는 {@link QuestionCriteriaService#updateCriteria}
 * (분석 기준 확정 시) 에서 수행되며, 본 서비스는 그 결과를 클라이언트에게 노출하는 역할만 합니다.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisResultService {

    private static final String SUMMARY_MESSAGE = "검증이 완료되었어요.";

    private final ConversationRepository conversationRepository;
    private final AnalysisFlowRepository analysisFlowRepository;
    private final MessageRepository messageRepository;
    private final AnalysisCriteriaRepository analysisCriteriaRepository;
    private final AnalysisResultRepository analysisResultRepository;
    private final AiTaggingJobRepository aiTaggingJobRepository;
    private final SecurityContextProvider securityContextProvider;
    private final FastApiClient fastApiClient;
    private final ObjectMapper objectMapper;

    /**
     * 최종 분석 결과를 조회합니다.
     */
    @Transactional(readOnly = true)
    public GetQuestionResultResponse getResult(
            Long conversationId, Long analysisFlowId, Long messageId, Long analysisCriteriaId) {

        AnalysisFlow flow = validateAccess(conversationId, analysisFlowId);
        loadMessage(flow, messageId);
        AnalysisCriteria criteria = loadCriteria(flow, analysisCriteriaId);

        AiTaggingJob job = aiTaggingJobRepository
                .findTopByMessageIdAndStageOrderByCreatedAtDesc(messageId, JobStage.ANALYSIS_RESULT)
                .orElseThrow(() -> new LogueException(ErrorCode.RESULT_NOT_FOUND));

        if (job.getStatus() != JobStatus.SUCCESS) {
            throw new LogueException(ErrorCode.RESULT_NOT_COMPLETED);
        }

        AnalysisResult result = analysisResultRepository
                .findByAnalysisCriteriaId(analysisCriteriaId)
                .orElseThrow(() -> new LogueException(ErrorCode.RESULT_NOT_FOUND));

        GetQuestionResultResponse.CriteriaInfo criteriaInfo = new GetQuestionResultResponse.CriteriaInfo(
                criteria.getAnalysisType().name(),
                criteria.getMetricName(),
                criteria.getBaseDateColumn(),
                criteria.getStandardPeriod(),
                criteria.getComparePeriod(),
                jsonArrayToStringList(criteria.getGroupBy()),
                criteria.getSortBy(),
                criteria.getSortDirection(),
                jsonNodeToFilters(criteria.getFilters())
        );

        GetQuestionResultResponse.ChartDataInfo chartData = objectMapper.convertValue(
                result.getChartData(),
                GetQuestionResultResponse.ChartDataInfo.class
        );

        return new GetQuestionResultResponse(
                result.getId(),
                SUMMARY_MESSAGE,
                result.getDescription(),
                criteriaInfo,
                chartData
        );
    }

    /**
     * 최종 분석 결과 도출 작업 상태를 조회합니다.
     */
    @Transactional(readOnly = true)
    public GetQuestionResultStatusResponse getResultStatus(
            Long conversationId, Long analysisFlowId, Long messageId, Long analysisCriteriaId) {

        AnalysisFlow flow = validateAccess(conversationId, analysisFlowId);
        loadMessage(flow, messageId);
        loadCriteria(flow, analysisCriteriaId);

        AiTaggingJob job = aiTaggingJobRepository
                .findTopByMessageIdAndStageOrderByCreatedAtDesc(messageId, JobStage.ANALYSIS_RESULT)
                .orElseThrow(() -> new LogueException(ErrorCode.RESULT_NOT_FOUND));

        return new GetQuestionResultStatusResponse(job.getStatus().name());
    }

    /**
     * 진행 중인 최종 분석 결과 도출 작업을 취소합니다.
     */
    @Transactional
    public CancelQuestionResultResponse cancelResult(
            Long conversationId, Long analysisFlowId, Long messageId, Long analysisCriteriaId) {

        AnalysisFlow flow = validateAccess(conversationId, analysisFlowId);
        loadMessage(flow, messageId);
        loadCriteria(flow, analysisCriteriaId);

        AiTaggingJob job = aiTaggingJobRepository
                .findTopByMessageIdAndStageOrderByCreatedAtDesc(messageId, JobStage.ANALYSIS_RESULT)
                .orElseThrow(() -> new LogueException(ErrorCode.RESULT_NOT_FOUND));

        JobStatus status = job.getStatus();
        boolean cancellable = status == JobStatus.QUEUED
                || status == JobStatus.RUNNING
                || status == JobStatus.RETRYING;
        if (!cancellable) {
            throw new LogueException(ErrorCode.RESULT_NOT_STARTED);
        }

        job.markCanceled();
        aiTaggingJobRepository.save(job);

        try {
            fastApiClient.cancelAnalysis(job.getId());
        } catch (Exception e) {
            log.warn("[AnalysisResultService] FastAPI 결과 취소 요청 실패 (무시): jobId={}", job.getId(), e);
        }

        return new CancelQuestionResultResponse("CANCELLED");
    }

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

    private AnalysisCriteria loadCriteria(AnalysisFlow flow, Long analysisCriteriaId) {
        AnalysisCriteria criteria = analysisCriteriaRepository.findById(analysisCriteriaId)
                .orElseThrow(() -> new LogueException(ErrorCode.CRITERIA_NOT_FOUND));
        if (!criteria.getAnalysisFlow().getId().equals(flow.getId())) {
            throw new LogueException(ErrorCode.FORBIDDEN);
        }
        return criteria;
    }

    private List<String> jsonArrayToStringList(JsonNode node) {
        if (node == null || !node.isArray()) return List.of();
        List<String> result = new ArrayList<>();
        node.forEach(n -> result.add(n.asText()));
        return result;
    }

    private List<GetQuestionResultResponse.FilterInfo> jsonNodeToFilters(JsonNode node) {
        if (node == null || !node.isArray()) return List.of();
        List<GetQuestionResultResponse.FilterInfo> result = new ArrayList<>();
        for (JsonNode item : node) {
            String field = item.path("field").asText(null);
            String operator = item.path("operator").asText(null);
            JsonNode value = item.path("value");
            result.add(new GetQuestionResultResponse.FilterInfo(field, operator, value));
        }
        return result;
    }
}
