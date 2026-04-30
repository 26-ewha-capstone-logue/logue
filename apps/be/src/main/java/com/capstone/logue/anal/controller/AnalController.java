package com.capstone.logue.anal.controller;

import com.capstone.logue.anal.dto.spring.request.CreateAnalysisFlowRequest;
import com.capstone.logue.anal.dto.spring.response.*;
import com.capstone.logue.anal.service.AnalService;
import com.capstone.logue.anal.service.JobRetryService;
import com.capstone.logue.auth.annotation.CurrentUser;
import com.capstone.logue.auth.security.UserPrincipal;
import com.capstone.logue.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
}
