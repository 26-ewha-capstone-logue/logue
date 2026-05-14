package com.capstone.logue.anal.client;

import com.capstone.logue.anal.dto.fastapi.response.FileAnalysisResponse;
import com.capstone.logue.anal.dto.fastapi.request.FileAnalysisRequest;
import com.capstone.logue.anal.dto.fastapi.request.QuestionAnalysisRequest;
import com.capstone.logue.anal.dto.fastapi.response.QuestionAnalysisResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * FastAPI 분석 서버와의 HTTP 통신을 담당하는 클라이언트입니다.
 *
 * <p>
 * 파일 분석 요청 및 분석 취소 요청을 FastAPI 서버로 전송합니다.
 * </p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FastApiClient {

    private final RestTemplate fastApiRestTemplate;

    @Value("${ai.base-url}")
    private String fastApiBaseUrl;

    /**
     * FastAPI 서버에 파일 분석을 요청합니다.
     *
     * <p>
     * HTTP 상태 코드를 직접 확인하기 위해 {@link ResponseEntity}를 반환합니다.
     * 응답 body가 null인 경우 예외가 발생합니다.
     * </p>
     *
     * @param request FastAPI 전송용 분석 요청 DTO
     * @return FastAPI 응답 (HTTP 상태 코드 + body 포함)
     * @throws IllegalStateException 응답 body가 null인 경우
     */
    public ResponseEntity<FileAnalysisResponse> analyzeFile(FileAnalysisRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<FileAnalysisResponse> response = fastApiRestTemplate.exchange(
                fastApiBaseUrl + "/v1/llm/data-sources/analyze",
                HttpMethod.POST,
                new HttpEntity<>(request, headers),
                FileAnalysisResponse.class
        );

        if (response.getBody() == null) {
            throw new IllegalStateException("FastAPI 응답 body가 null입니다.");
        }
        return response;
    }

    /**
     * FastAPI 서버에 질문 → 분석 기준 도출을 요청합니다.
     *
     * <p>응답 body 가 null 인 경우 예외가 발생합니다.</p>
     *
     * @param request 질문 분석 요청 DTO
     * @return FastAPI 응답 (HTTP 상태 코드 + body 포함)
     * @throws IllegalStateException 응답 body 가 null 인 경우
     */
    public ResponseEntity<QuestionAnalysisResponse> resolveAnalysisCriteria(QuestionAnalysisRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<QuestionAnalysisResponse> response = fastApiRestTemplate.exchange(
                fastApiBaseUrl + "/v1/llm/analysis-criteria/resolve",
                HttpMethod.POST,
                new HttpEntity<>(request, headers),
                QuestionAnalysisResponse.class
        );

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() == null) {
            throw new IllegalStateException("FastAPI 응답 body가 null입니다.");
        }
        return response;
    }

    /**
     * FastAPI 서버에 진행 중인 분석 작업 취소를 요청합니다.
     *
     * <p>
     * 취소 요청 실패 시 예외가 발생할 수 있으며,
     * 호출부({@link com.capstone.logue.anal.service.AnalService#cancelSummary})에서
     * 예외를 무시하고 처리합니다.
     * </p>
     *
     * @param jobId 취소할 작업 ID
     */
    public void cancelAnalysis(Long jobId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        fastApiRestTemplate.postForEntity(
                fastApiBaseUrl + "/v1/llm/data-sources/analyze/cancel",
                new HttpEntity<>(Map.of("jobId", jobId), headers),
                Void.class
        );
    }
}
