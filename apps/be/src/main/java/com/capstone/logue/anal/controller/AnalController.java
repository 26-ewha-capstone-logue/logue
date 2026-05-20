package com.capstone.logue.anal.controller;

import com.capstone.logue.anal.dto.spring.request.CreateAnalysisFlowRequest;
import com.capstone.logue.anal.dto.spring.request.CreateQuestionRequest;
import com.capstone.logue.anal.dto.spring.request.UpdateQuestionCriteriaRequest;
import com.capstone.logue.anal.dto.spring.response.*;
import com.capstone.logue.anal.service.AnalService;
import com.capstone.logue.anal.service.JobRetryService;
import com.capstone.logue.anal.service.QuestionCriteriaService;
import com.capstone.logue.auth.annotation.CurrentUser;
import com.capstone.logue.auth.security.UserPrincipal;
import com.capstone.logue.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 분석 대화 흐름 관련 API를 제공하는 컨트롤러입니다.
 *
 * <p>대화 시작, AnalysisFlow 생성, 데이터 상태 요약 조회/폴링/취소,
 * FAILED 작업 수동 재시도 기능을 제공합니다.</p>
 */
@Tag(name = "Anal", description = "분석 대화 API")
@RestController
@RequestMapping("/api/anal")
@RequiredArgsConstructor
public class AnalController {

    private final AnalService analService;
    private final JobRetryService jobRetryService;
    private final QuestionCriteriaService questionCriteriaService;

    /**
     * 새로운 분석 대화를 시작합니다.
     *
     * @param userPrincipal 현재 인증된 사용자 정보
     * @return 생성된 대화 정보 (conversationId, createdAt)
     */
    @Operation(summary = "대화 시작", description = "새로운 분석 대화 생성")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "대화 시작 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 내부 오류 (C004)"),
    })
    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<CreateConversationResponse>> createConversation(
            @CurrentUser UserPrincipal userPrincipal
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "대화 시작 성공",
                analService.createConversation(userPrincipal.userId())));
    }


    /**
     * 지정된 대화에 새로운 AnalysisFlow를 생성하고 파일 분석 비동기 작업을 시작합니다.
     *
     * <p>FastAPI 분석 결과를 기다리지 않고 즉시 응답을 반환합니다.
     * 클라이언트는 폴링 API를 통해 분석 진행 상태를 확인해야 합니다.</p>
     *
     * @param conversationId 대화 ID
     * @param request        dataSourceId를 포함한 요청 DTO
     * @return 생성된 AnalysisFlow 정보 (analysisFlowId, dataSourceId, createdAt)
     */
    @Operation(summary = "AnalysisFlow 시작", description = "대화 내 새로운 분석 흐름을 생성합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "AnalysisFlow 생성 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "해당 파일을 찾을 수 없음 (D001)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 내부 오류 (C004)"),
    })
    @PostMapping("/conversations/{conversationId}/analysisFlows")
    public ResponseEntity<ApiResponse<CreateAnalysisFlowResponse>> createAnalysisFlow(
            @PathVariable Long conversationId,
            @RequestBody CreateAnalysisFlowRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Analysis Flow 생성 성공", analService.createAnalysisFlow(conversationId, request)));
    }

    /**
     * 분석 흐름의 데이터 상태 요약 결과를 조회합니다.
     *
     * <p>작업 상태가 {@code SUCCESS}가 아닌 경우 예외가 발생합니다.</p>
     *
     * @param conversationId 대화 ID
     * @param analysisFlowId 분석 흐름 ID
     * @return 데이터 상태 요약 결과 (컬럼 정보, 경고 메시지 등)
     */
    @Operation(summary = "데이터 상태 요약 조회", description = "분석 흐름의 데이터 상태 요약 결과를 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "데이터 상태 요약 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "해당 파일을 찾을 수 없음 (D001)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "데이터 요약이 완료되지 않음 (D101)"),
    })
    @GetMapping("/conversations/{conversationId}/analysisFlows/{analysisFlowId}/summary")
    public ResponseEntity<ApiResponse<GetSummaryResponse>> getSummary(
            @PathVariable Long conversationId,
            @PathVariable Long analysisFlowId) {
        return ResponseEntity.ok(ApiResponse.success("데이터 상태 요약 성공", analService.getSummary(conversationId, analysisFlowId)));
    }

    /**
     * 데이터 상태 요약 생성의 진행 상태를 폴링합니다.
     *
     * @param conversationId 대화 ID
     * @param analysisFlowId 분석 흐름 ID
     * @return 현재 작업 상태 (QUEUED / RUNNING / RETRYING / SUCCESS / FAILED / CANCELED)
     */
    @Operation(summary = "데이터 상태 요약 조회 폴링", description = "데이터 상태 요약 생성 진행 상태를 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "상태 조회 성공 (QUEUED / RUNNING / RETRYING / SUCCESS / FAILED)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "해당 파일을 찾을 수 없음 (D001)"),
    })
    @GetMapping("/conversations/{conversationId}/analysisFlows/{analysisFlowId}/summary/status")
    public ResponseEntity<ApiResponse<GetSummaryStatusResponse>> getSummaryStatus(
            @PathVariable Long conversationId,
            @PathVariable Long analysisFlowId) {
        return ResponseEntity.ok(ApiResponse.success("상태 조회 성공", analService.getSummaryStatus(conversationId, analysisFlowId)));
    }

    /**
     * 진행 중인 데이터 상태 요약 생성을 취소합니다.
     *
     * <p>QUEUED, RUNNING, RETRYING 상태인 작업만 취소할 수 있습니다.</p>
     *
     * @param conversationId 대화 ID
     * @param analysisFlowId 분석 흐름 ID
     * @return 취소 결과 (status: CANCELLED)
     */
    @Operation(summary = "데이터 상태 요약 취소", description = "진행 중인 데이터 상태 요약 생성을 취소합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "취소 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "해당 파일을 찾을 수 없음 (D001)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "데이터 요약이 시작되지 않음 (D102)"),
    })
    @PostMapping("/conversations/{conversationId}/analysisFlows/{analysisFlowId}/summary/cancel")
    public ResponseEntity<ApiResponse<CancelSummaryResponse>> cancelSummary(
            @PathVariable Long conversationId,
            @PathVariable Long analysisFlowId) {
        return ResponseEntity.ok(ApiResponse.success("데이터 상태 요약 취소", analService.cancelSummary(conversationId, analysisFlowId)));
    }


    /**
     * FAILED 상태의 분석 작업을 수동으로 재시도합니다.
     *
     * <p>작업을 QUEUED 상태로 초기화한 후 비동기 분석을 재시작합니다.</p>
     *
     * @param jobId 재시도할 작업 ID
     * @return 202 Accepted
     */
    @Operation(summary = "분석 작업 재시도", description = "FAILED 상태의 분석 작업을 수동으로 재시도합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "202", description = "재시도 요청 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "작업을 찾을 수 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "FAILED 상태가 아니어서 재시도 불가"),
    })
    @PostMapping("/jobs/{jobId}/retry")
    public ResponseEntity<ApiResponse<Void>> retryJob(@PathVariable Long jobId) {
        jobRetryService.retryJob(jobId);
        return ResponseEntity.accepted().build();
    }

    /**
     * 사용자 질문을 전송하고 분석 기준 도출 작업을 시작합니다.
     *
     * @param conversationId 대화 ID
     * @param analysisFlowId 분석 흐름 ID
     * @param request        질문 본문
     * @return 생성된 메시지 정보
     */
    @Operation(summary = "사용자 질문 전송", description = "사용자 질문 메시지를 저장하고 분석 기준 도출 비동기 작업을 트리거합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "질문 분석 시작"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "데이터 상태 요약 미완료 (AN106)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "대화/플로우/데이터 소스 없음"),
    })
    @PostMapping("/conversations/{conversationId}/analysisFlows/{analysisFlowId}/messages")
    public ResponseEntity<ApiResponse<CreateQuestionResponse>> createQuestion(
            @PathVariable Long conversationId,
            @PathVariable Long analysisFlowId,
            @Valid @RequestBody CreateQuestionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "질문 분석 성공",
                questionCriteriaService.createQuestion(conversationId, analysisFlowId, request)));
    }

    /**
     * 분석 기준 도출 결과를 조회합니다.
     *
     * @param conversationId 대화 ID
     * @param analysisFlowId 분석 흐름 ID
     * @param messageId      사용자 메시지 ID
     * @return 분석 기준 + 데이터 경고
     */
    @Operation(summary = "분석 기준 조회", description = "도출이 완료된 분석 기준과 데이터 경고를 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "분석 기준 조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "분석 기준 도출 미완료 (AN102)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "분석 기준/메시지 없음"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "502", description = "LLM 호출 실패 (L001)"),
    })
    @GetMapping("/conversations/{conversationId}/analysisFlows/{analysisFlowId}/messages/{messageId}/analysisCriterias")
    public ResponseEntity<ApiResponse<GetQuestionCriteriaResponse>> getCriteria(
            @PathVariable Long conversationId,
            @PathVariable Long analysisFlowId,
            @PathVariable Long messageId) {
        return ResponseEntity.ok(ApiResponse.success(
                "질문 분석 완료",
                questionCriteriaService.getCriteria(conversationId, analysisFlowId, messageId)));
    }

    /**
     * 분석 기준을 수정하거나 확정합니다.
     *
     * @param conversationId 대화 ID
     * @param analysisFlowId 분석 흐름 ID
     * @param messageId      사용자 메시지 ID
     * @param request        수정 요청
     * @return 분석 기준 ID + 확정 시각
     */
    @Operation(summary = "분석 기준 수정/확정", description = "분석 기준을 수정하거나 confirmed=true 로 확정합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "분석 기준 확정"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "분석 기준 없음 (AN101)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "이미 확정된 분석 기준 (AN104)"),
    })
    @PutMapping("/conversations/{conversationId}/analysisFlows/{analysisFlowId}/messages/{messageId}/analysisCriterias")
    public ResponseEntity<ApiResponse<UpdateQuestionCriteriaResponse>> updateCriteria(
            @PathVariable Long conversationId,
            @PathVariable Long analysisFlowId,
            @PathVariable Long messageId,
            @RequestBody UpdateQuestionCriteriaRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "분석 기준 확정",
                questionCriteriaService.updateCriteria(conversationId, analysisFlowId, messageId, request)));
    }

    /**
     * 진행 중인 분석 기준 도출 작업을 취소합니다.
     *
     * @param conversationId 대화 ID
     * @param analysisFlowId 분석 흐름 ID
     * @param messageId      사용자 메시지 ID
     * @return 취소 결과 (status: CANCELLED)
     */
    @Operation(summary = "분석 기준 도출 취소", description = "QUEUED/RUNNING/RETRYING 상태의 분석 기준 도출 작업을 취소합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "분석 기준 조회 취소"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "분석 기준 도출 미시작 (AN103)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "분석 기준 없음 (AN101)"),
    })
    @PostMapping("/conversations/{conversationId}/analysisFlows/{analysisFlowId}/messages/{messageId}/analysisCriterias/cancel")
    public ResponseEntity<ApiResponse<CancelQuestionCriteriaResponse>> cancelCriteria(
            @PathVariable Long conversationId,
            @PathVariable Long analysisFlowId,
            @PathVariable Long messageId) {
        return ResponseEntity.ok(ApiResponse.success(
                "분석 기준 조회 취소",
                questionCriteriaService.cancelCriteria(conversationId, analysisFlowId, messageId)));
    }

    /**
     * 분석 기준 도출 작업 상태를 조회합니다.
     *
     * @param conversationId 대화 ID
     * @param analysisFlowId 분석 흐름 ID
     * @param messageId      사용자 메시지 ID
     * @return 현재 작업 상태
     */
    @Operation(summary = "분석 기준 도출 상태 폴링", description = "분석 기준 도출 비동기 작업의 현재 상태를 반환합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "상태 조회 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "분석 기준 없음 (AN101)"),
    })
    @GetMapping("/conversations/{conversationId}/analysisFlows/{analysisFlowId}/messages/{messageId}/analysisCriterias/status")
    public ResponseEntity<ApiResponse<GetQuestionCriteriaStatusResponse>> getCriteriaStatus(
            @PathVariable Long conversationId,
            @PathVariable Long analysisFlowId,
            @PathVariable Long messageId) {
        return ResponseEntity.ok(ApiResponse.success(
                "분석 기준 생성 상태 조회",
                questionCriteriaService.getCriteriaStatus(conversationId, analysisFlowId, messageId)));
    }
}
