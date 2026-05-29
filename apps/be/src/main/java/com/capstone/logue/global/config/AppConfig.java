package com.capstone.logue.global.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.client.ResponseErrorHandler;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;

@EnableAsync
@Configuration
public class AppConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .messageConverters(new MappingJackson2HttpMessageConverter())
                .build();
    }

    /**
     * FastAPI 전용 RestTemplate.
     *
     * <ul>
     *   <li>요청·응답 직렬화는 snake_case Jackson 모듈 사용 (FastAPI DTO 규약).</li>
     *   <li>4xx/5xx 응답을 throw 하지 않고 {@code ResponseEntity} 로 그대로 반환한다.
     *       호출부({@code *AsyncService}) 가 status code 기반 분기 + retry 정책을 직접 제어하므로
     *       기본 {@code DefaultResponseErrorHandler} 가 throw 하면 inline 분기가 dead code 가 된다 (#278).</li>
     *   <li>모르는 필드를 만나도 역직렬화에 실패하지 않는다. FastAPI 에러 응답은 성공 DTO 와
     *       다른 envelope({@code error_code} 등)를 내려보내므로, 기본 {@code FAIL_ON_UNKNOWN_PROPERTIES}
     *       가 켜져 있으면 body 파싱이 status code 분기보다 먼저 throw 되어 위 #278 분기가 무력화된다 (#316).</li>
     * </ul>
     */
    @Bean
    public RestTemplate fastApiRestTemplate(RestTemplateBuilder builder) {
        ObjectMapper snakeCaseMapper = new ObjectMapper()
                .setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE)
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        RestTemplate restTemplate = builder
                .messageConverters(new MappingJackson2HttpMessageConverter(snakeCaseMapper))
                .build();
        restTemplate.setErrorHandler(new NoOpResponseErrorHandler());
        return restTemplate;
    }

    /**
     * 4xx/5xx 응답에 throw 하지 않는 {@link ResponseErrorHandler}.
     *
     * <p>{@link org.springframework.web.client.DefaultResponseErrorHandler} 는 4xx/5xx 에
     * {@link org.springframework.web.client.RestClientException} 을 던지므로, FastAPI 클라이언트
     * 호출부의 {@code response.getStatusCode().value()} 분기에 도달하지 못한다 (#278).</p>
     */
    private static final class NoOpResponseErrorHandler implements ResponseErrorHandler {
        @Override
        public boolean hasError(ClientHttpResponse response) throws IOException {
            return false;
        }

        @Override
        public void handleError(ClientHttpResponse response) throws IOException {
            // no-op: 호출부가 status code 로 직접 분기·retry 한다.
        }
    }
}
