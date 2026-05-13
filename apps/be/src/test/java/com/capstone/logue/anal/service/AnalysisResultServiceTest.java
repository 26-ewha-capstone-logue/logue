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
import com.capstone.logue.auth.security.UserPrincipal;
import com.capstone.logue.global.entity.AiTaggingJob;
import com.capstone.logue.global.entity.AnalysisCriteria;
import com.capstone.logue.global.entity.AnalysisFlow;
import com.capstone.logue.global.entity.AnalysisResult;
import com.capstone.logue.global.entity.Conversation;
import com.capstone.logue.global.entity.DataSource;
import com.capstone.logue.global.entity.Message;
import com.capstone.logue.global.entity.User;
import com.capstone.logue.global.entity.enums.AnalysisType;
import com.capstone.logue.global.entity.enums.JobStage;
import com.capstone.logue.global.entity.enums.JobStatus;
import com.capstone.logue.global.entity.enums.MessageRole;
import com.capstone.logue.global.entity.enums.MetricType;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link AnalysisResultService} 단위 테스트.
 */
@ExtendWith(MockitoExtension.class)
class AnalysisResultServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long CONVERSATION_ID = 10L;
    private static final Long ANALYSIS_FLOW_ID = 11L;
    private static final Long MESSAGE_ID = 22L;
    private static final Long CRITERIA_ID = 33L;
    private static final Long RESULT_ID = 44L;
    private static final Long JOB_ID = 100L;
    private static final Long DATASOURCE_ID = 5L;

    @Mock private ConversationRepository conversationRepository;
    @Mock private AnalysisFlowRepository analysisFlowRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private AnalysisCriteriaRepository analysisCriteriaRepository;
    @Mock private AnalysisResultRepository analysisResultRepository;
    @Mock private AiTaggingJobRepository aiTaggingJobRepository;
    @Mock private SecurityContextProvider securityContextProvider;
    @Mock private FastApiClient fastApiClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private AnalysisResultService service;

    private User user;
    private Conversation conversation;
    private DataSource dataSource;
    private AnalysisFlow flow;
    private Message message;
    private AnalysisCriteria criteria;

    @BeforeEach
    void setUp() {
        service = new AnalysisResultService(
                conversationRepository,
                analysisFlowRepository,
                messageRepository,
                analysisCriteriaRepository,
                analysisResultRepository,
                aiTaggingJobRepository,
                securityContextProvider,
                fastApiClient,
                objectMapper
        );

        user = User.builder()
                .id(USER_ID).email("t@t.com").providerUserId("p").name("n").provider("GOOGLE")
                .build();
        conversation = Conversation.builder()
                .id(CONVERSATION_ID).user(user).title("c")
                .build();
        dataSource = DataSource.builder()
                .id(DATASOURCE_ID).user(user).fileName("d.csv").rowCount(10).columnCount(2)
                .schemaJson(objectMapper.createObjectNode())
                .build();
        flow = AnalysisFlow.builder()
                .id(ANALYSIS_FLOW_ID).conversation(conversation).dataSource(dataSource)
                .build();
        message = Message.builder()
                .id(MESSAGE_ID).analysisFlow(flow).role(MessageRole.USER).content("Q?")
                .build();
        criteria = AnalysisCriteria.builder()
                .id(CRITERIA_ID).analysisFlow(flow)
                .analysisType(AnalysisType.COMPARISON).metricName("conversion_rate")
                .metricType(MetricType.RATIO)
                .baseDateColumn("signed_at").standardPeriod("this_week").comparePeriod("last_week")
                .sortBy("delta").sortDirection("asc")
                .groupBy(objectMapper.valueToTree(List.of("channel")))
                .isConfirmed(true)
                .build();
    }

    private void stubAccess() {
        when(conversationRepository.findById(CONVERSATION_ID)).thenReturn(Optional.of(conversation));
        when(analysisFlowRepository.findById(ANALYSIS_FLOW_ID)).thenReturn(Optional.of(flow));
        when(messageRepository.findById(MESSAGE_ID)).thenReturn(Optional.of(message));
        when(analysisCriteriaRepository.findById(CRITERIA_ID)).thenReturn(Optional.of(criteria));
        when(securityContextProvider.getAuthenticatedUser())
                .thenReturn(new UserPrincipal(USER_ID, "t@t.com"));
    }

    @Test
    @DisplayName("getResult: Job 이 SUCCESS 이면 결과 + 기준 + 차트 데이터를 매핑하여 반환")
    void getResult_success() {
        stubAccess();

        AiTaggingJob job = AiTaggingJob.builder()
                .id(JOB_ID).conversation(conversation).analysisFlow(flow).message(message)
                .stage(JobStage.ANALYSIS_RESULT).status(JobStatus.SUCCESS)
                .build();
        when(aiTaggingJobRepository.findTopByMessageIdAndStageOrderByCreatedAtDesc(
                MESSAGE_ID, JobStage.ANALYSIS_RESULT))
                .thenReturn(Optional.of(job));

        AnalysisResult result = AnalysisResult.builder()
                .id(RESULT_ID).analysisCriteria(criteria)
                .description("가입 전환율이 지난주 대비 낮은 순으로 채널을 나열했어요.")
                .chartData(objectMapper.valueToTree(Map.of(
                        "tabs", List.of("channel"),
                        "defaultTab", "channel",
                        "tabResults", List.of(),
                        "exportEnabled", true
                )))
                .build();
        when(analysisResultRepository.findByAnalysisCriteriaId(CRITERIA_ID))
                .thenReturn(Optional.of(result));

        GetQuestionResultResponse response = service.getResult(
                CONVERSATION_ID, ANALYSIS_FLOW_ID, MESSAGE_ID, CRITERIA_ID);

        assertThat(response.resultId()).isEqualTo(RESULT_ID);
        assertThat(response.description()).contains("나열했어요");
        assertThat(response.criteria().analysisType()).isEqualTo("COMPARISON");
        assertThat(response.chartData().defaultTab()).isEqualTo("channel");
    }

    @Test
    @DisplayName("getResult: Job 이 RUNNING 이면 RESULT_NOT_COMPLETED")
    void getResult_notCompleted() {
        stubAccess();

        AiTaggingJob job = AiTaggingJob.builder()
                .id(JOB_ID).conversation(conversation).analysisFlow(flow).message(message)
                .stage(JobStage.ANALYSIS_RESULT).status(JobStatus.RUNNING)
                .build();
        when(aiTaggingJobRepository.findTopByMessageIdAndStageOrderByCreatedAtDesc(
                MESSAGE_ID, JobStage.ANALYSIS_RESULT))
                .thenReturn(Optional.of(job));

        assertThatThrownBy(() -> service.getResult(
                CONVERSATION_ID, ANALYSIS_FLOW_ID, MESSAGE_ID, CRITERIA_ID))
                .isInstanceOf(LogueException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.RESULT_NOT_COMPLETED);
    }

    @Test
    @DisplayName("getResult: Job 자체가 없으면 RESULT_NOT_FOUND")
    void getResult_jobNotFound() {
        stubAccess();
        when(aiTaggingJobRepository.findTopByMessageIdAndStageOrderByCreatedAtDesc(
                MESSAGE_ID, JobStage.ANALYSIS_RESULT))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getResult(
                CONVERSATION_ID, ANALYSIS_FLOW_ID, MESSAGE_ID, CRITERIA_ID))
                .isInstanceOf(LogueException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.RESULT_NOT_FOUND);
    }

    @Test
    @DisplayName("getResultStatus: Job 상태 문자열 반환")
    void getResultStatus_returnsStatus() {
        stubAccess();

        AiTaggingJob job = AiTaggingJob.builder()
                .id(JOB_ID).conversation(conversation).analysisFlow(flow).message(message)
                .stage(JobStage.ANALYSIS_RESULT).status(JobStatus.RUNNING)
                .build();
        when(aiTaggingJobRepository.findTopByMessageIdAndStageOrderByCreatedAtDesc(
                MESSAGE_ID, JobStage.ANALYSIS_RESULT))
                .thenReturn(Optional.of(job));

        GetQuestionResultStatusResponse response = service.getResultStatus(
                CONVERSATION_ID, ANALYSIS_FLOW_ID, MESSAGE_ID, CRITERIA_ID);

        assertThat(response.status()).isEqualTo("RUNNING");
    }

    @Test
    @DisplayName("cancelResult: QUEUED Job 을 CANCELED 로 전이하고 FastAPI 취소 시도")
    void cancelResult_queued() {
        stubAccess();

        AiTaggingJob job = AiTaggingJob.builder()
                .id(JOB_ID).conversation(conversation).analysisFlow(flow).message(message)
                .stage(JobStage.ANALYSIS_RESULT).status(JobStatus.QUEUED)
                .build();
        when(aiTaggingJobRepository.findTopByMessageIdAndStageOrderByCreatedAtDesc(
                MESSAGE_ID, JobStage.ANALYSIS_RESULT))
                .thenReturn(Optional.of(job));

        CancelQuestionResultResponse response = service.cancelResult(
                CONVERSATION_ID, ANALYSIS_FLOW_ID, MESSAGE_ID, CRITERIA_ID);

        assertThat(response.status()).isEqualTo("CANCELLED");
        assertThat(job.getStatus()).isEqualTo(JobStatus.CANCELED);
        verify(fastApiClient).cancelAnalysis(JOB_ID);
    }

    @Test
    @DisplayName("cancelResult: FastAPI 취소 실패해도 응답은 CANCELLED")
    void cancelResult_fastApiFailureSwallowed() {
        stubAccess();

        AiTaggingJob job = AiTaggingJob.builder()
                .id(JOB_ID).conversation(conversation).analysisFlow(flow).message(message)
                .stage(JobStage.ANALYSIS_RESULT).status(JobStatus.RUNNING)
                .build();
        when(aiTaggingJobRepository.findTopByMessageIdAndStageOrderByCreatedAtDesc(
                MESSAGE_ID, JobStage.ANALYSIS_RESULT))
                .thenReturn(Optional.of(job));
        doThrow(new RestClientException("boom")).when(fastApiClient).cancelAnalysis(JOB_ID);

        CancelQuestionResultResponse response = service.cancelResult(
                CONVERSATION_ID, ANALYSIS_FLOW_ID, MESSAGE_ID, CRITERIA_ID);

        assertThat(response.status()).isEqualTo("CANCELLED");
        assertThat(job.getStatus()).isEqualTo(JobStatus.CANCELED);
    }

    @Test
    @DisplayName("cancelResult: SUCCESS 인 Job 은 RESULT_NOT_STARTED")
    void cancelResult_notCancellable() {
        stubAccess();

        AiTaggingJob job = AiTaggingJob.builder()
                .id(JOB_ID).conversation(conversation).analysisFlow(flow).message(message)
                .stage(JobStage.ANALYSIS_RESULT).status(JobStatus.SUCCESS)
                .build();
        when(aiTaggingJobRepository.findTopByMessageIdAndStageOrderByCreatedAtDesc(
                MESSAGE_ID, JobStage.ANALYSIS_RESULT))
                .thenReturn(Optional.of(job));

        assertThatThrownBy(() -> service.cancelResult(
                CONVERSATION_ID, ANALYSIS_FLOW_ID, MESSAGE_ID, CRITERIA_ID))
                .isInstanceOf(LogueException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.RESULT_NOT_STARTED);

        verify(fastApiClient, never()).cancelAnalysis(any());
    }

    @Test
    @DisplayName("validateAccess: criteria 가 다른 flow 소속이면 FORBIDDEN")
    void loadCriteria_flowMismatch() {
        when(conversationRepository.findById(CONVERSATION_ID)).thenReturn(Optional.of(conversation));
        when(analysisFlowRepository.findById(ANALYSIS_FLOW_ID)).thenReturn(Optional.of(flow));
        when(messageRepository.findById(MESSAGE_ID)).thenReturn(Optional.of(message));
        when(securityContextProvider.getAuthenticatedUser())
                .thenReturn(new UserPrincipal(USER_ID, "t@t.com"));

        AnalysisFlow other = AnalysisFlow.builder()
                .id(999L).conversation(conversation).dataSource(dataSource).build();
        AnalysisCriteria foreign = AnalysisCriteria.builder()
                .id(CRITERIA_ID).analysisFlow(other)
                .analysisType(AnalysisType.COMPARISON).metricName("m").metricType(MetricType.RATIO)
                .baseDateColumn("d").standardPeriod("p").sortBy("s").sortDirection("asc")
                .groupBy(objectMapper.valueToTree(List.of("g")))
                .build();
        when(analysisCriteriaRepository.findById(CRITERIA_ID)).thenReturn(Optional.of(foreign));

        assertThatThrownBy(() -> service.getResultStatus(
                CONVERSATION_ID, ANALYSIS_FLOW_ID, MESSAGE_ID, CRITERIA_ID))
                .isInstanceOf(LogueException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.FORBIDDEN);
    }
}
