package com.capstone.logue.anal.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.logue.anal.dto.request.CreateAnalysisFlowRequest;
import com.capstone.logue.anal.dto.response.CreateAnalysisFlowResponse;
import com.capstone.logue.anal.dto.response.CreateConversationResponse;
import com.capstone.logue.anal.repository.*;
import com.capstone.logue.data.repository.DataSourceRepository;
import com.capstone.logue.auth.provider.SecurityContextProvider;
import com.capstone.logue.global.entity.*;
import com.capstone.logue.global.entity.enums.JobStage;
import com.capstone.logue.global.entity.enums.JobStatus;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.capstone.logue.user.repository.UserRepository;
import com.capstone.logue.anal.dto.fastapi.FileAnalysisResponse;
import com.capstone.logue.anal.dto.request.FileAnalysisRequest;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.OffsetDateTime;
import java.util.Optional;

/**
 * {@link AnalService}의 단위 테스트 클래스입니다.
 *
 * <p>
 * 이 테스트는 Spring 컨텍스트를 로드하지 않고(Mockito 기반),
 * AnalService의 핵심 비즈니스 로직을 독립적으로 검증합니다.
 * </p>
 *
 * <p>검증 범위:</p>
 * <ul>
 *   <li>대화 생성 시 Conversation이 정상적으로 저장되는지</li>
 *   <li>AnalysisFlow 생성 시 기본 흐름이 정상 수행되는지</li>
 *   <li>잘못된 입력(conversationId, dataSourceId)에 대해 예외가 발생하는지</li>
 *   <li>FastAPI 호출이 정상적으로 수행되는지 (mock 기반 검증)</li>
 * </ul>
 *
 * <p>
 * 외부 의존성(DB, FastAPI 서버 등)은 모두 Mock으로 대체하여
 * 순수 비즈니스 로직만 검증합니다.
 * </p>
 */
@ExtendWith(MockitoExtension.class)
class AnalServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long CONVERSATION_ID = 10L;
    private static final Long DATASOURCE_ID = 5L;
    private static final Long ANALYSIS_FLOW_ID = 11L;

    @Mock private ConversationRepository conversationRepository;
    @Mock private AnalysisFlowRepository analysisFlowRepository;
    @Mock private DataSourceRepository dataSourceRepository;
    @Mock private DataSourceColumnRepository dataSourceColumnRepository;
    @Mock private SourceDataWarningRepository sourceDataWarningRepository;
    @Mock private AiTaggingJobRepository aiTaggingJobRepository;
    @Mock private SecurityContextProvider securityContextProvider;
    @Mock private UserRepository userRepository;
    @Mock private FileAnalysisRequestBuilder fileAnalysisRequestBuilder;
    @Mock private RestTemplate restTemplate;
    @Mock private FileAnalysisAsyncService fileAnalysisAsyncService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private AnalService analService;

    @BeforeEach
    void setUp() {
        analService = new AnalService(
                conversationRepository,
                analysisFlowRepository,
                dataSourceRepository,
                dataSourceColumnRepository,
                sourceDataWarningRepository,
                aiTaggingJobRepository,
                securityContextProvider,
                userRepository,
                fileAnalysisAsyncService,
                restTemplate
        );

        ReflectionTestUtils.setField(
                analService,
                "fastApiBaseUrl",
                "http://localhost:8000"
        );
    }

    /**
     * 정상적인 사용자 인증 상태에서 대화를 생성할 경우,
     * Conversation 엔티티가 저장되고 생성된 conversationId가 반환되는지 검증한다.
     *
     * <p>검증 내용:</p>
     * <ul>
     *   <li>SecurityContextProvider를 통해 사용자 ID를 정상적으로 가져오는지</li>
     *   <li>해당 사용자로 Conversation이 생성되는지</li>
     *   <li>ConversationRepository.save()가 호출되는지</li>
     *   <li>응답에 conversationId가 포함되는지</li>
     * </ul>
     */
    @Test
    @DisplayName("대화 생성 시 Conversation 엔티티가 저장되고 conversationId가 반환된다")
    void createConversation_success() {
        User user = User.builder()
                .id(USER_ID).email("test@test.com")
                .providerUserId("p-1").name("테스트").provider("GOOGLE")
                .build();
        Conversation saved = Conversation.builder()
                .id(CONVERSATION_ID).user(user).title("새 대화")
                .build();

        when(securityContextProvider.getAuthenticatedUserId()).thenReturn(USER_ID);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(conversationRepository.save(any())).thenReturn(saved);

        CreateConversationResponse response = analService.createConversation();

        assertThat(response.getConversationId()).isEqualTo(CONVERSATION_ID);
        verify(conversationRepository).save(any());
    }

    /**
     * 정상적인 요청으로 AnalysisFlow를 생성할 경우,
     * FastAPI 파일 분석 요청까지 포함한 전체 흐름이 정상 수행되는지 검증한다.
     *
     * <p>검증 내용:</p>
     * <ul>
     *   <li>Conversation과 DataSource가 정상 조회되는지</li>
     *   <li>AnalysisFlow 엔티티가 생성 및 저장되는지</li>
     *   <li>FileAnalysisRequestBuilder를 통해 FastAPI 요청 DTO가 생성되는지</li>
     *   <li>AiTaggingJob이 QUEUED 상태로 저장되는지</li>
     *   <li>RestTemplate을 통해 FastAPI 호출이 수행되는지</li>
     *   <li>응답 DTO(CreateAnalysisFlowResponse)가 올바르게 반환되는지</li>
     * </ul>
     *
     * <p>
     * FastAPI 응답은 Mock으로 대체되며,
     * 실제 외부 API 호출 없이 내부 로직 흐름만 검증한다.
     * </p>
     */
    @Test
    @DisplayName("AnalysisFlow 생성 시 Job을 QUEUED로 저장하고 파일 분석 비동기 작업을 시작한다")
    void createAnalysisFlow_success() {
        User user = User.builder()
                .id(USER_ID)
                .email("test@test.com")
                .providerUserId("p-1")
                .name("테스트")
                .provider("GOOGLE")
                .build();

        Conversation conversation = Conversation.builder()
                .id(CONVERSATION_ID)
                .user(user)
                .title("새 대화")
                .build();

        ObjectNode schemaJson = objectMapper.createObjectNode();

        DataSource dataSource = DataSource.builder()
                .id(DATASOURCE_ID)
                .user(user)
                .fileName("test.csv")
                .rowCount(10)
                .columnCount(2)
                .schemaJson(schemaJson)
                .build();

        AnalysisFlow savedFlow = AnalysisFlow.builder()
                .id(ANALYSIS_FLOW_ID)
                .conversation(conversation)
                .dataSource(dataSource)
                .build();

        AiTaggingJob savedJob = AiTaggingJob.builder()
                .id(1L).conversation(conversation)
                .stage(JobStage.DATA_STATUS).status(JobStatus.QUEUED)
                .startedAt(OffsetDateTime.now())
                .build();

        when(conversationRepository.findById(CONVERSATION_ID)).thenReturn(Optional.of(conversation));
        when(dataSourceRepository.findById(DATASOURCE_ID)).thenReturn(Optional.of(dataSource));
        when(analysisFlowRepository.save(any(AnalysisFlow.class))).thenReturn(savedFlow);
        when(aiTaggingJobRepository.save(any(AiTaggingJob.class))).thenReturn(savedJob);

        CreateAnalysisFlowRequest request = CreateAnalysisFlowRequest.builder()
                .dataSourceId(DATASOURCE_ID)
                .build();

        CreateAnalysisFlowResponse response = analService.createAnalysisFlow(CONVERSATION_ID, request);

        assertThat(response.getAnalysisFlowId()).isEqualTo(ANALYSIS_FLOW_ID);
        assertThat(response.getDataSourceId()).isEqualTo(DATASOURCE_ID);
        verify(analysisFlowRepository).save(any(AnalysisFlow.class));
        verify(aiTaggingJobRepository).save(any(AiTaggingJob.class));
        verify(fileAnalysisAsyncService).analyzeFileAsync(eq(1L), eq(DATASOURCE_ID), any(String.class));
    }

    /**
     * 존재하지 않는 conversationId로 AnalysisFlow 생성 요청 시
     * CONVERSATION_NOT_FOUND 예외가 발생하는지 검증한다.
     *
     * <p>검증 내용:</p>
     * <ul>
     *   <li>ConversationRepository에서 조회 실패 시 예외 발생 여부</li>
     *   <li>올바른 ErrorCode(CONVERSATION_NOT_FOUND)가 반환되는지</li>
     * </ul>
     */
    @Test
    @DisplayName("존재하지 않는 conversationId로 AnalysisFlow 생성 시 CONVERSATION_NOT_FOUND 예외가 발생한다")
    void createAnalysisFlow_conversationNotFound_throwsException() {
        when(conversationRepository.findById(999L)).thenReturn(Optional.empty());

        CreateAnalysisFlowRequest request = CreateAnalysisFlowRequest.builder()
                .dataSourceId(DATASOURCE_ID)
                .build();

        assertThatThrownBy(() -> analService.createAnalysisFlow(999L, request))
                .isInstanceOf(LogueException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.CONVERSATION_NOT_FOUND);
    }

    /**
     * 존재하지 않는 dataSourceId로 AnalysisFlow 생성 요청 시
     * DATASOURCE_NOT_FOUND 예외가 발생하는지 검증한다.
     *
     * <p>검증 내용:</p>
     * <ul>
     *   <li>Conversation은 정상 조회되지만 DataSource 조회 실패 시 예외 발생 여부</li>
     *   <li>올바른 ErrorCode(DATASOURCE_NOT_FOUND)가 반환되는지</li>
     * </ul>
     */
    @Test
    @DisplayName("존재하지 않는 dataSourceId로 AnalysisFlow 생성 시 DATASOURCE_NOT_FOUND 예외가 발생한다")
    void createAnalysisFlow_dataSourceNotFound_throwsException() {
        User user = User.builder()
                .id(USER_ID).email("test@test.com")
                .providerUserId("p-1").name("테스트").provider("GOOGLE")
                .build();
        Conversation conversation = Conversation.builder()
                .id(CONVERSATION_ID).user(user).title("새 대화")
                .build();

        when(conversationRepository.findById(CONVERSATION_ID)).thenReturn(Optional.of(conversation));
        when(dataSourceRepository.findById(999L)).thenReturn(Optional.empty());

        CreateAnalysisFlowRequest request = CreateAnalysisFlowRequest.builder()
                .dataSourceId(999L)
                .build();

        assertThatThrownBy(() -> analService.createAnalysisFlow(CONVERSATION_ID, request))
                .isInstanceOf(LogueException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.DATASOURCE_NOT_FOUND);
    }
}