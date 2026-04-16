package com.capstone.logue.auth.handler;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * OAuth2 로그인 실패 시 동작을 정의하는 핸들러입니다.
 *
 * <p>Spring Security의 OAuth2 로그인 과정에서 인증에 실패하면 호출되며,
 * 실패 원인을 로그로 기록한 후 기본 실패 처리 로직을 수행합니다.</p>
 *
 * <p>기본적으로 {@link SimpleUrlAuthenticationFailureHandler}를 상속하여
 * redirect 또는 에러 응답 처리를 그대로 유지하면서,
 * 추가적인 로깅을 수행하기 위해 사용됩니다.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    /**
     * OAuth2 인증 실패 시 호출되는 메서드입니다.
     *
     * <p>실패 원인을 로그로 남기고,
     * 부모 클래스의 기본 실패 처리 로직을 수행합니다.</p>
     *
     * @param request HTTP 요청
     * @param response HTTP 응답
     * @param exception 인증 실패 예외
     * @throws ServletException 서블릿 처리 중 예외 발생 시
     * @throws IOException 입출력 예외 발생 시
     */
    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws ServletException, IOException {
        log.error("LOGIN FAILED : {}", exception.getMessage());
        super.onAuthenticationFailure(request, response, exception);
    }
}
