package com.capstone.logue.anal.controller;

import com.capstone.logue.anal.dto.request.CreateAnalysisFlowRequest;
import com.capstone.logue.anal.dto.response.*;
import com.capstone.logue.anal.service.AnalService;
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
 * <p>대화 시작, AnalysisFlow 생성, 데이터 상태 요약 조회/폴링/취소 기능을 제공합니다.</p>
 */
@Tag(name = "Anal", description = "분석 대화 API")
@RestController
@RequestMapping("/api/anal")
@RequiredArgsConstructor
public class AnalController {

    private final AnalService analService;

    /**
     * 새로운 분석 대화를 시작합니다.
     */
    @Operation(summary = "대화 시작", description = "새로운 분석 대화 생성")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "대화 시작 성공"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "해당 파일을 찾을 수 없음 (D001)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "서버 내부 오류 (C004)"),
    })
    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<CreateConversationResponse>> createConversation() {
        return ResponseEntity.ok(ApiResponse.success("대화 시작 성공", analService.createConversation()));
    }


    /**
     * 지정된 대화에 새로운 AnalysisFlow를 시작합니다.
     *
     * @param conversationId 대화 ID
     * @param request dataSourceId를 포함한 요청 DTO
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
     * 데이터 상태 요약 결과를 조회합니다.
     *
     * @param conversationId  대화 ID
     * @param analysisFlowId  분석 흐름 ID
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
     * 데이터 상태 요약 생성 진행 상태를 폴링합니다.
     *
     * @param conversationId  대화 ID
     * @param analysisFlowId  분석 흐름 ID
     */
    @Operation(summary = "데이터 상태 요약 조회 폴링", description = "데이터 상태 요약 생성 진행 상태를 조회합니다.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "상태 조회 성공 (QUEUED / RUNNING / SUCCESS / FAILED)"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "해당 파일을 찾을 수 없음 (D001)"),
    })
    @GetMapping("/conversations/{conversationId}/analysisFlows/{analysisFlowId}/summary/status")
    public ResponseEntity<ApiResponse<GetSummaryStatusResponse>> getSummaryStatus(
            @PathVariable Long conversationId,
            @PathVariable Long analysisFlowId) {
        return ResponseEntity.ok(ApiResponse.success("상태 조회 성공", analService.getSummaryStatus(conversationId, analysisFlowId)));
    }

    /**
     * 데이터 상태 요약 생성을 취소합니다.
     *
     * @param conversationId  대화 ID
     * @param analysisFlowId  분석 흐름 ID
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
}
