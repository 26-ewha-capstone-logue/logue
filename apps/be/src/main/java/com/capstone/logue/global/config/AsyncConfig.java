package com.capstone.logue.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * 비동기 작업 실행을 활성화하기 위한 설정 클래스입니다.
 *
 * <p>
 * Spring의 {@link org.springframework.scheduling.annotation.Async} 기능을 활성화하여
 * 메서드 단위 비동기 처리를 가능하게 합니다.
 * </p>
 *
 * <p>
 * 본 프로젝트에서는 파일 분석 요청(FastAPI 호출)을
 * 메인 요청 흐름과 분리하여 백그라운드에서 처리하기 위해 사용됩니다.
 * </p>
 *
 * <p>
 * 활성화 후 {@code @Async}가 선언된 메서드는 별도의 스레드에서 실행됩니다.
 * </p>
 */
@Configuration
@EnableAsync
public class AsyncConfig {
}