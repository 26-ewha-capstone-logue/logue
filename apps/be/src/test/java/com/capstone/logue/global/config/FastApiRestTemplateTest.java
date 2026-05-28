package com.capstone.logue.global.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;

/**
 * {@link AppConfig#fastApiRestTemplate} 의 에러 핸들러 동작 단위 테스트.
 *
 * <p>기본 {@code DefaultResponseErrorHandler} 는 4xx/5xx 에 throw 하므로 호출부의
 * {@code response.getStatusCode().value()} 분기가 dead code 가 된다. 본 빈은 NoOp
 * {@link org.springframework.web.client.ResponseErrorHandler} 를 박아 4xx/5xx 응답도
 * 그대로 {@link ResponseEntity} 로 반환되도록 한다 (#278).</p>
 */
class FastApiRestTemplateTest {

    private RestTemplate fastApiRestTemplate;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        fastApiRestTemplate = new AppConfig().fastApiRestTemplate(new RestTemplateBuilder());
        server = MockRestServiceServer.createServer(fastApiRestTemplate);
    }

    @Test
    @DisplayName("502 응답에 throw 하지 않고 ResponseEntity 를 반환한다")
    @SuppressWarnings({"unchecked", "rawtypes"})
    void fastApiRestTemplate_5xx_doesNotThrow() {
        server.expect(requestTo("http://test/v1/llm/data-sources/analyze"))
                .andRespond(withStatus(HttpStatus.BAD_GATEWAY)
                        .body("{\"error_code\":\"LLM_CALL_FAILED\"}")
                        .contentType(MediaType.APPLICATION_JSON));

        ResponseEntity<Map> response = fastApiRestTemplate.exchange(
                "http://test/v1/llm/data-sources/analyze",
                HttpMethod.POST,
                new HttpEntity<>("{}"),
                Map.class
        );

        assertThat(response.getStatusCode().value()).isEqualTo(502);
        assertThat(response.getBody()).containsEntry("error_code", "LLM_CALL_FAILED");
    }

    @Test
    @DisplayName("422 응답에 throw 하지 않고 ResponseEntity 를 반환한다")
    @SuppressWarnings({"unchecked", "rawtypes"})
    void fastApiRestTemplate_4xx_doesNotThrow() {
        server.expect(requestTo("http://test/v1/llm/data-sources/analyze"))
                .andRespond(withStatus(HttpStatus.UNPROCESSABLE_ENTITY)
                        .body("{\"error_code\":\"REQUEST_VALIDATION_FAILED\"}")
                        .contentType(MediaType.APPLICATION_JSON));

        ResponseEntity<Map> response = fastApiRestTemplate.exchange(
                "http://test/v1/llm/data-sources/analyze",
                HttpMethod.POST,
                new HttpEntity<>("{}"),
                Map.class
        );

        assertThat(response.getStatusCode().value()).isEqualTo(422);
        assertThat(response.getBody()).containsEntry("error_code", "REQUEST_VALIDATION_FAILED");
    }

    @Test
    @DisplayName("500 응답에 throw 하지 않는다 (sanity check, RestClientException 미발생)")
    void fastApiRestTemplate_5xx_noRestClientException() {
        server.expect(requestTo("http://test/v1/llm/data-sources/analyze"))
                .andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR));

        assertThatCode(() -> fastApiRestTemplate.exchange(
                "http://test/v1/llm/data-sources/analyze",
                HttpMethod.POST,
                new HttpEntity<>("{}"),
                String.class
        )).doesNotThrowAnyException();
    }
}
