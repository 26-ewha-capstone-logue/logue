package com.capstone.logue.anal.service;

import com.capstone.logue.anal.dto.request.CreateAnalysisFlowRequest;
import com.capstone.logue.anal.dto.response.*;
import com.capstone.logue.anal.repository.AnalysisFlowRepository;
import com.capstone.logue.anal.repository.ConversationRepository;
import com.capstone.logue.anal.repository.DataSourceRepository;
import com.capstone.logue.auth.provider.SecurityContextProvider;
import com.capstone.logue.global.entity.AnalysisFlow;
import com.capstone.logue.global.entity.Conversation;
import com.capstone.logue.global.entity.DataSource;
import com.capstone.logue.global.entity.User;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.capstone.logue.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


/**
 * 분석 대화 흐름 관련 비즈니스 로직을 처리하는 서비스입니다.
 *
 * <p>대화 생성, AnalysisFlow 생성, 데이터 상태 요약 조회/폴링/취소 기능을 제공합니다.</p>
 */
@Service
@RequiredArgsConstructor
public class AnalService {

    private final ConversationRepository conversationRepository;
    private final AnalysisFlowRepository analysisFlowRepository;
    private final DataSourceRepository dataSourceRepository;
    private final SecurityContextProvider securityContextProvider;
    private final UserRepository userRepository;

    /**
     * 새로운 분석 대화를 생성합니다.
     *
     * <p>Conversation 엔티티를 저장하고 생성된 대화 ID와 생성 시각을 반환합니다.</p>
     *
     * @return 생성된 대화 정보 (conversationId, createdAt)
     * @throws LogueException 파일을 찾을 수 없는 경우 (D001), 서버 내부 오류 발생 시 (C004)
     */
    public CreateConversationResponse createConversation() {
        Long userId = securityContextProvider.getAuthenticatedUserId();
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
     * 지정된 대화에 새로운 AnalysisFlow를 생성합니다.
     *
     * <p>dataSourceId를 기반으로 AnalysisFlow 엔티티를 저장하고 생성 정보를 반환합니다.</p>
     *
     * @param conversationId 대화 ID
     * @param request        dataSourceId를 포함한 요청 DTO
     * @return 생성된 AnalysisFlow 정보 (analysisFlowId, dataSourceId, createdAt)
     * @throws LogueException 대화를 찾을 수 없는 경우(CV001), 파일을 찾을 수 없는 경우 (D001), 서버 내부 오류 발생 시 (C004)
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

        return CreateAnalysisFlowResponse.builder()
                .analysisFlowId(saved.getId())
                .dataSourceId(request.getDataSourceId())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    /**
     * 분석 흐름의 데이터 상태 요약 결과를 조회합니다.
     *
     * <p>FastAPI 분석이 완료된 결과를 DB에서 조회하여 반환합니다.
     * 요약이 아직 완료되지 않은 경우 예외를 발생시킵니다.</p>
     *
     * @param conversationId 대화 ID
     * @param analysisFlowId 분석 흐름 ID
     * @return 데이터 상태 요약 결과 (컬럼 분류, 경고 메시지 등)
     * @throws LogueException 파일을 찾을 수 없는 경우 (D001), 요약이 완료되지 않은 경우 (D101)
     */
    public GetSummaryResponse getSummary(Long conversationId, Long analysisFlowId) {
        AnalysisFlow analysisFlow = analysisFlowRepository.findById(analysisFlowId)
                .orElseThrow(() -> new LogueException(ErrorCode.DATASOURCE_NOT_FOUND));

        // TODO: AiTaggingJob 상태 확인 후 COMPLETED 아니면 D101 예외
        // TODO: DataSource에서 요약 결과 조회 후 GetSummaryResponse 매핑
        throw new LogueException(ErrorCode.SUMMARY_NOT_COMPLETED);
    }

    /**
     * 데이터 상태 요약 생성의 진행 상태를 조회합니다.
     *
     * <p>AiTaggingJob의 현재 상태를 반환합니다.
     * 상태값은 QUEUED, RUNNING, SUCCESS, FAILED 중 하나입니다.</p>
     *
     * @param conversationId 대화 ID
     * @param analysisFlowId 분석 흐름 ID
     * @return 현재 요약 생성 상태 (status)
     * @throws LogueException 파일을 찾을 수 없는 경우 (D001)
     */
    public GetSummaryStatusResponse getSummaryStatus(Long conversationId, Long analysisFlowId) {
        analysisFlowRepository.findById(analysisFlowId)
                .orElseThrow(() -> new LogueException(ErrorCode.DATASOURCE_NOT_FOUND));

        // TODO: AiTaggingJob 상태 조회 후 반환
        return GetSummaryStatusResponse.builder()
                .status("QUEUED")   // 임시
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

        // TODO: AiTaggingJob 상태 확인 후 QUEUED/RUNNING 아니면 D102 예외
        // TODO: job 취소 처리
        return CancelSummaryResponse.builder()
                .status("CANCELLED")
                .build();
    }
}
