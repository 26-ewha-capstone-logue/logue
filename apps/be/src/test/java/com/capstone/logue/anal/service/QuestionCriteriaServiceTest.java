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
import com.capstone.logue.auth.security.UserPrincipal;
import com.capstone.logue.global.entity.AiTaggingJob;
import com.capstone.logue.global.entity.AnalysisCriteria;
import com.capstone.logue.global.entity.AnalysisFlow;
import com.capstone.logue.global.entity.Conversation;
import com.capstone.logue.global.entity.DataSource;
import com.capstone.logue.global.entity.FlowDataWarning;
import com.capstone.logue.global.entity.Message;
import com.capstone.logue.global.entity.User;
import com.capstone.logue.global.entity.enums.AnalysisType;
import com.capstone.logue.global.entity.enums.FlowWarningKey;
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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link QuestionCriteriaService} 단위 테스트.
 */
@ExtendWith(MockitoExtension.class)
class QuestionCriteriaServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long CONVERSATION_ID = 10L;
    private static final Long ANALYSIS_FLOW_ID = 11L;
    private static final Long DATASOURCE_ID = 5L;
    private static final Long MESSAGE_ID = 22L;
    private static final Long JOB_ID = 100L;
    private static final Long CRITERIA_ID = 200L;

    @Mock private ConversationRepository conversationRepository;
    @Mock private AnalysisFlowRepository analysisFlowRepository;
    @Mock private AiTaggingJobRepository aiTaggingJobRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private AnalysisCriteriaRepository analysisCriteriaRepository;
    @Mock private FlowDataWarningRepository flowDataWarningRepository;
    @Mock private SecurityContextProvider securityContextProvider;
    @Mock private QuestionAnalysisAsyncService questionAnalysisAsyncService;
    @Mock private FastApiClient fastApiClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private QuestionCriteriaService service;

    private User user;
    private Conversation conversation;
    private DataSource dataSource;
    private AnalysisFlow flow;

    @BeforeEach
    void setUp() {
        service = new QuestionCriteriaService(
                conversationRepository,
                analysisFlowRepository,
                aiTaggingJobRepository,
                messageRepository,
                analysisCriteriaRepository,
                flowDataWarningRepository,
                securityContextProvider,
                questionAnalysisAsyncService,
                fastApiClient,
                objectMapper
        );

        user = User.builder()
                .id(USER_ID).email("t@t.com").providerUserId("p").name("n").provider("GOOGLE")
                .build();
        conversation = Conversation.builder()
                .id(CONVERSATION_ID).user(user).title("새 대화")
                .build();
        dataSource = DataSource.builder()
                .id(DATASOURCE_ID).user(user).fileName("d.csv").rowCount(10).columnCount(2)
                .schemaJson(objectMapper.createObjectNode())
                .build();
        flow = AnalysisFlow.builder()
                .id(ANALYSIS_FLOW_ID).conversation(conversation).dataSource(dataSource)
                .build();
    }

    private void stubAccess() {
        when(conversationRepository.findById(CONVERSATION_ID)).thenReturn(Optional.of(conversation));
        when(analysisFlowRepository.findById(ANALYSIS_FLOW_ID)).thenReturn(Optional.of(flow));
        when(securityContextProvider.getAuthenticatedUser())
                .thenReturn(new UserPrincipal(USER_ID, "t@t.com"));
    }

    @Test
    @DisplayName("createQuestion: DATA_STATUS Job 이 SUCCESS 면 메시지+Job 생성 후 비동기 호출")
    void createQuestion_success() {
        stubAccess();

        AiTaggingJob dataStatusJob = AiTaggingJob.builder()
                .id(99L).conversation(conversation).analysisFlow(flow)
                .stage(JobStage.DATA_STATUS).status(JobStatus.SUCCESS)
                .build();
        when(aiTaggingJobRepository.findTopByAnalysisFlowIdAndStageOrderByCreatedAtDesc(
                ANALYSIS_FLOW_ID, JobStage.DATA_STATUS))
                .thenReturn(Optional.of(dataStatusJob));

        Message savedMessage = Message.builder()
                .id(MESSAGE_ID).analysisFlow(flow).role(MessageRole.USER).content("Q?")
                .build();
        when(messageRepository.save(any(Message.class))).thenReturn(savedMessage);

        AiTaggingJob savedJob = AiTaggingJob.builder()
                .id(JOB_ID).conversation(conversation).analysisFlow(flow).message(savedMessage)
                .stage(JobStage.ANALYSIS_CRITERIA).status(JobStatus.QUEUED)
                .build();
        when(aiTaggingJobRepository.save(any(AiTaggingJob.class))).thenReturn(savedJob);

        CreateQuestionResponse response = service.createQuestion(
                CONVERSATION_ID, ANALYSIS_FLOW_ID, new CreateQuestionRequest("Q?"));

        assertThat(response.messageId()).isEqualTo(MESSAGE_ID);
        assertThat(response.question()).isEqualTo("Q?");
        verify(messageRepository).save(any(Message.class));
        verify(aiTaggingJobRepository).save(any(AiTaggingJob.class));
        verify(questionAnalysisAsyncService).resolveCriteriaAsync(eq(JOB_ID), eq("Q?"));
    }

    @Test
    @DisplayName("createQuestion: DATA_STATUS Job 이 SUCCESS 아니면 DATASOURCE_NOT_READY")
    void createQuestion_dataStatusNotReady() {
        stubAccess();

        AiTaggingJob runningJob = AiTaggingJob.builder()
                .id(99L).conversation(conversation).analysisFlow(flow)
                .stage(JobStage.DATA_STATUS).status(JobStatus.RUNNING)
                .build();
        when(aiTaggingJobRepository.findTopByAnalysisFlowIdAndStageOrderByCreatedAtDesc(
                ANALYSIS_FLOW_ID, JobStage.DATA_STATUS))
                .thenReturn(Optional.of(runningJob));

        assertThatThrownBy(() -> service.createQuestion(
                CONVERSATION_ID, ANALYSIS_FLOW_ID, new CreateQuestionRequest("Q?")))
                .isInstanceOf(LogueException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.DATASOURCE_NOT_READY);

        verify(messageRepository, never()).save(any());
        verify(questionAnalysisAsyncService, never()).resolveCriteriaAsync(any(), any());
    }

    @Test
    @DisplayName("createQuestion: DATA_STATUS Job 이 아예 없으면 DATASOURCE_NOT_READY")
    void createQuestion_noDataStatusJob() {
        stubAccess();
        when(aiTaggingJobRepository.findTopByAnalysisFlowIdAndStageOrderByCreatedAtDesc(
                ANALYSIS_FLOW_ID, JobStage.DATA_STATUS))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createQuestion(
                CONVERSATION_ID, ANALYSIS_FLOW_ID, new CreateQuestionRequest("Q?")))
                .isInstanceOf(LogueException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.DATASOURCE_NOT_READY);
    }

    @Test
    @DisplayName("getCriteria: Job 이 SUCCESS 이고 데이터 경고가 없으면 ready 메시지를 반환")
    void getCriteria_success_noWarning() {
        stubAccess();
        Message message = Message.builder()
                .id(MESSAGE_ID).analysisFlow(flow).role(MessageRole.USER).content("Q?")
                .build();
        when(messageRepository.findById(MESSAGE_ID)).thenReturn(Optional.of(message));

        AiTaggingJob job = AiTaggingJob.builder()
                .id(JOB_ID).conversation(conversation).analysisFlow(flow).message(message)
                .stage(JobStage.ANALYSIS_CRITERIA).status(JobStatus.SUCCESS)
                .build();
        when(aiTaggingJobRepository.findTopByMessageIdAndStageOrderByCreatedAtDesc(
                MESSAGE_ID, JobStage.ANALYSIS_CRITERIA))
                .thenReturn(Optional.of(job));

        AnalysisCriteria criteria = AnalysisCriteria.builder()
                .id(CRITERIA_ID).analysisFlow(flow)
                .analysisType(AnalysisType.COMPARISON).metricName("conversion_rate")
                .metricType(MetricType.RATIO)
                .baseDateColumn("signed_at").standardPeriod("this_week").comparePeriod("last_week")
                .sortBy("delta").sortDirection("asc")
                .groupBy(objectMapper.valueToTree(List.of("channel")))
                .isConfirmed(false)
                .build();
        when(analysisCriteriaRepository.findTopByAnalysisFlowIdOrderByCreatedAtDesc(ANALYSIS_FLOW_ID))
                .thenReturn(Optional.of(criteria));
        when(flowDataWarningRepository.findByAnalysisCriteriaId(CRITERIA_ID))
                .thenReturn(List.of());

        GetQuestionCriteriaResponse response = service.getCriteria(
                CONVERSATION_ID, ANALYSIS_FLOW_ID, MESSAGE_ID);

        assertThat(response.messageId()).isEqualTo(MESSAGE_ID);
        assertThat(response.criteria().analysisType()).isEqualTo("COMPARISON");
        assertThat(response.criteria().dataWarning()).isEmpty();
        assertThat(response.message()).contains("아래 분석 기준으로 검증");
    }

    @Test
    @DisplayName("getCriteria: 데이터 경고가 있으면 need-confirm 메시지를 반환")
    void getCriteria_success_withWarning() {
        stubAccess();
        Message message = Message.builder()
                .id(MESSAGE_ID).analysisFlow(flow).role(MessageRole.USER).content("Q?")
                .build();
        when(messageRepository.findById(MESSAGE_ID)).thenReturn(Optional.of(message));

        AiTaggingJob job = AiTaggingJob.builder()
                .id(JOB_ID).conversation(conversation).analysisFlow(flow).message(message)
                .stage(JobStage.ANALYSIS_CRITERIA).status(JobStatus.SUCCESS)
                .build();
        when(aiTaggingJobRepository.findTopByMessageIdAndStageOrderByCreatedAtDesc(
                MESSAGE_ID, JobStage.ANALYSIS_CRITERIA))
                .thenReturn(Optional.of(job));

        AnalysisCriteria criteria = AnalysisCriteria.builder()
                .id(CRITERIA_ID).analysisFlow(flow)
                .analysisType(AnalysisType.COMPARISON).metricName("conversion_rate")
                .metricType(MetricType.RATIO)
                .baseDateColumn("signed_at").standardPeriod("this_week").comparePeriod("last_week")
                .sortBy("delta").sortDirection("asc")
                .groupBy(objectMapper.valueToTree(List.of("channel")))
                .dataWarnings(objectMapper.valueToTree(List.of(
                        java.util.Map.of("code", "QUESTION_DATA_MISMATCH",
                                "relatedFields", List.of("device_type"))
                )))
                .isConfirmed(false)
                .build();
        when(analysisCriteriaRepository.findTopByAnalysisFlowIdOrderByCreatedAtDesc(ANALYSIS_FLOW_ID))
                .thenReturn(Optional.of(criteria));

        FlowDataWarning warning = FlowDataWarning.builder()
                .id(1L).analysisCriteria(criteria)
                .code(FlowWarningKey.QUESTION_DATA_MISMATCH)
                .name(FlowWarningKey.QUESTION_DATA_MISMATCH.getName())
                .comment(FlowWarningKey.QUESTION_DATA_MISMATCH.getComment())
                .build();
        when(flowDataWarningRepository.findByAnalysisCriteriaId(CRITERIA_ID))
                .thenReturn(List.of(warning));

        GetQuestionCriteriaResponse response = service.getCriteria(
                CONVERSATION_ID, ANALYSIS_FLOW_ID, MESSAGE_ID);

        assertThat(response.criteria().dataWarning()).hasSize(1);
        assertThat(response.criteria().needConfirm()).containsExactly("device_type");
        assertThat(response.message()).contains("꼭 확인해주세요");
    }

    @Test
    @DisplayName("getCriteria: Job 이 SUCCESS 가 아니면 CRITERIA_NOT_COMPLETED")
    void getCriteria_notCompleted() {
        stubAccess();
        Message message = Message.builder().id(MESSAGE_ID).analysisFlow(flow).role(MessageRole.USER).content("Q?").build();
        when(messageRepository.findById(MESSAGE_ID)).thenReturn(Optional.of(message));

        AiTaggingJob job = AiTaggingJob.builder()
                .id(JOB_ID).conversation(conversation).analysisFlow(flow).message(message)
                .stage(JobStage.ANALYSIS_CRITERIA).status(JobStatus.RUNNING)
                .build();
        when(aiTaggingJobRepository.findTopByMessageIdAndStageOrderByCreatedAtDesc(
                MESSAGE_ID, JobStage.ANALYSIS_CRITERIA))
                .thenReturn(Optional.of(job));

        assertThatThrownBy(() -> service.getCriteria(CONVERSATION_ID, ANALYSIS_FLOW_ID, MESSAGE_ID))
                .isInstanceOf(LogueException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.CRITERIA_NOT_COMPLETED);
    }

    @Test
    @DisplayName("updateCriteria: confirmed=true 면 isConfirmed=true 와 confirmedAt 갱신")
    void updateCriteria_confirm() {
        stubAccess();
        Message message = Message.builder().id(MESSAGE_ID).analysisFlow(flow).role(MessageRole.USER).content("Q?").build();
        when(messageRepository.findById(MESSAGE_ID)).thenReturn(Optional.of(message));

        AnalysisCriteria criteria = AnalysisCriteria.builder()
                .id(CRITERIA_ID).analysisFlow(flow)
                .analysisType(AnalysisType.COMPARISON).metricName("conversion_rate")
                .metricType(MetricType.RATIO)
                .baseDateColumn("signed_at").standardPeriod("this_week").comparePeriod("last_week")
                .sortBy("delta").sortDirection("asc")
                .groupBy(objectMapper.valueToTree(List.of("channel")))
                .isConfirmed(false)
                .build();
        when(analysisCriteriaRepository.findTopByAnalysisFlowIdOrderByCreatedAtDesc(ANALYSIS_FLOW_ID))
                .thenReturn(Optional.of(criteria));
        when(analysisCriteriaRepository.save(any(AnalysisCriteria.class))).thenReturn(criteria);

        UpdateQuestionCriteriaRequest request = new UpdateQuestionCriteriaRequest(
                "signed_at", "this_week", "last_week",
                List.of("channel", "device"),
                "delta", "asc", null, List.of(), true);

        UpdateQuestionCriteriaResponse response = service.updateCriteria(
                CONVERSATION_ID, ANALYSIS_FLOW_ID, MESSAGE_ID, request);

        assertThat(response.analysisCriteriaId()).isEqualTo(CRITERIA_ID);
        assertThat(criteria.getIsConfirmed()).isTrue();
        assertThat(criteria.getConfirmedAt()).isNotNull();
        verify(analysisCriteriaRepository).save(criteria);
    }

    @Test
    @DisplayName("updateCriteria: 이미 confirmed 인데 다시 confirmed=true 면 CRITERIA_ALREADY_CONFIRMED")
    void updateCriteria_alreadyConfirmed() {
        stubAccess();
        Message message = Message.builder().id(MESSAGE_ID).analysisFlow(flow).role(MessageRole.USER).content("Q?").build();
        when(messageRepository.findById(MESSAGE_ID)).thenReturn(Optional.of(message));

        AnalysisCriteria criteria = AnalysisCriteria.builder()
                .id(CRITERIA_ID).analysisFlow(flow)
                .analysisType(AnalysisType.COMPARISON).metricName("m").metricType(MetricType.RATIO)
                .baseDateColumn("d").standardPeriod("p").sortBy("s").sortDirection("asc")
                .groupBy(objectMapper.valueToTree(List.of("g")))
                .isConfirmed(true)
                .build();
        when(analysisCriteriaRepository.findTopByAnalysisFlowIdOrderByCreatedAtDesc(ANALYSIS_FLOW_ID))
                .thenReturn(Optional.of(criteria));

        UpdateQuestionCriteriaRequest request = new UpdateQuestionCriteriaRequest(
                "d", "p", null, List.of("g"), "s", "asc", null, List.of(), true);

        assertThatThrownBy(() -> service.updateCriteria(
                CONVERSATION_ID, ANALYSIS_FLOW_ID, MESSAGE_ID, request))
                .isInstanceOf(LogueException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.CRITERIA_ALREADY_CONFIRMED);
    }

    @Test
    @DisplayName("cancelCriteria: QUEUED Job 을 CANCELED 로 전이하고 FastAPI 취소 시도")
    void cancelCriteria_queued() {
        stubAccess();
        Message message = Message.builder().id(MESSAGE_ID).analysisFlow(flow).role(MessageRole.USER).content("Q?").build();
        when(messageRepository.findById(MESSAGE_ID)).thenReturn(Optional.of(message));

        AiTaggingJob job = AiTaggingJob.builder()
                .id(JOB_ID).conversation(conversation).analysisFlow(flow).message(message)
                .stage(JobStage.ANALYSIS_CRITERIA).status(JobStatus.QUEUED)
                .build();
        when(aiTaggingJobRepository.findTopByMessageIdAndStageOrderByCreatedAtDesc(
                MESSAGE_ID, JobStage.ANALYSIS_CRITERIA))
                .thenReturn(Optional.of(job));

        CancelQuestionCriteriaResponse response = service.cancelCriteria(
                CONVERSATION_ID, ANALYSIS_FLOW_ID, MESSAGE_ID);

        assertThat(response.status()).isEqualTo("CANCELLED");
        assertThat(job.getStatus()).isEqualTo(JobStatus.CANCELED);
        verify(fastApiClient).cancelAnalysis(JOB_ID);
    }

    @Test
    @DisplayName("cancelCriteria: FastAPI 취소 실패해도 응답은 CANCELLED")
    void cancelCriteria_fastApiFailureSwallowed() {
        stubAccess();
        Message message = Message.builder().id(MESSAGE_ID).analysisFlow(flow).role(MessageRole.USER).content("Q?").build();
        when(messageRepository.findById(MESSAGE_ID)).thenReturn(Optional.of(message));

        AiTaggingJob job = AiTaggingJob.builder()
                .id(JOB_ID).conversation(conversation).analysisFlow(flow).message(message)
                .stage(JobStage.ANALYSIS_CRITERIA).status(JobStatus.RUNNING)
                .build();
        when(aiTaggingJobRepository.findTopByMessageIdAndStageOrderByCreatedAtDesc(
                MESSAGE_ID, JobStage.ANALYSIS_CRITERIA))
                .thenReturn(Optional.of(job));

        doThrow(new RestClientException("connect refused")).when(fastApiClient).cancelAnalysis(JOB_ID);

        CancelQuestionCriteriaResponse response = service.cancelCriteria(
                CONVERSATION_ID, ANALYSIS_FLOW_ID, MESSAGE_ID);

        assertThat(response.status()).isEqualTo("CANCELLED");
        assertThat(job.getStatus()).isEqualTo(JobStatus.CANCELED);
    }

    @Test
    @DisplayName("cancelCriteria: 이미 SUCCESS 인 Job 은 CRITERIA_NOT_STARTED")
    void cancelCriteria_notCancellable() {
        stubAccess();
        Message message = Message.builder().id(MESSAGE_ID).analysisFlow(flow).role(MessageRole.USER).content("Q?").build();
        when(messageRepository.findById(MESSAGE_ID)).thenReturn(Optional.of(message));

        AiTaggingJob job = AiTaggingJob.builder()
                .id(JOB_ID).conversation(conversation).analysisFlow(flow).message(message)
                .stage(JobStage.ANALYSIS_CRITERIA).status(JobStatus.SUCCESS)
                .build();
        when(aiTaggingJobRepository.findTopByMessageIdAndStageOrderByCreatedAtDesc(
                MESSAGE_ID, JobStage.ANALYSIS_CRITERIA))
                .thenReturn(Optional.of(job));

        assertThatThrownBy(() -> service.cancelCriteria(CONVERSATION_ID, ANALYSIS_FLOW_ID, MESSAGE_ID))
                .isInstanceOf(LogueException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.CRITERIA_NOT_STARTED);

        verify(fastApiClient, never()).cancelAnalysis(any());
    }

    @Test
    @DisplayName("getCriteriaStatus: Job 상태 문자열 반환")
    void getCriteriaStatus_returnsStatus() {
        stubAccess();
        Message message = Message.builder().id(MESSAGE_ID).analysisFlow(flow).role(MessageRole.USER).content("Q?").build();
        when(messageRepository.findById(MESSAGE_ID)).thenReturn(Optional.of(message));

        AiTaggingJob job = AiTaggingJob.builder()
                .id(JOB_ID).conversation(conversation).analysisFlow(flow).message(message)
                .stage(JobStage.ANALYSIS_CRITERIA).status(JobStatus.RUNNING)
                .build();
        when(aiTaggingJobRepository.findTopByMessageIdAndStageOrderByCreatedAtDesc(
                MESSAGE_ID, JobStage.ANALYSIS_CRITERIA))
                .thenReturn(Optional.of(job));

        GetQuestionCriteriaStatusResponse response = service.getCriteriaStatus(
                CONVERSATION_ID, ANALYSIS_FLOW_ID, MESSAGE_ID);

        assertThat(response.status()).isEqualTo("RUNNING");
    }
}
