package com.capstone.logue.anal.client;

import com.capstone.logue.anal.dto.fastapi.response.FileAnalysisResponse;
import com.capstone.logue.anal.dto.fastapi.request.FileAnalysisRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class FastApiClient {

    private final RestTemplate fastApiRestTemplate;

    @Value("${ai.base-url}")
    private String fastApiBaseUrl;

    public FileAnalysisResponse analyzeFile(FileAnalysisRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<FileAnalysisResponse> response = fastApiRestTemplate.exchange(
                fastApiBaseUrl + "/v1/llm/data-sources/analyze",
                HttpMethod.POST,
                new HttpEntity<>(request, headers),
                FileAnalysisResponse.class
        );

        FileAnalysisResponse body = response.getBody();
        if (body == null) {
            throw new IllegalStateException("FastAPI 응답 body가 null입니다.");
        }
        return body;
    }

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
