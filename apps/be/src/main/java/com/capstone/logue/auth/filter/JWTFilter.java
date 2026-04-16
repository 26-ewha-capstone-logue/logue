package com.capstone.logue.auth.filter;

import com.capstone.logue.auth.provider.JWTProvider;
import com.capstone.logue.auth.security.UserAuthentication;
import com.capstone.logue.global.exception.LogueException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@RequiredArgsConstructor
public class JWTFilter extends OncePerRequestFilter {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JWTProvider jwtProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        try {
            String accessToken = resolveAccessToken(request);  // 쿠키에서 JWT를 가져온다.

            //토큰이 없으면 인증 없이 다음 필터로 넘김
            if (accessToken == null) {
                filterChain.doFilter(request,response);
                return;
            }

            jwtProvider.validateToken(accessToken);  // JWT 유효성 검증
            Long userId = jwtProvider.getUserIdFromToken(accessToken);  // JWT에서 사용자 ID 추출
            setAuthentication(userId);  // 인증 정보 설정
            filterChain.doFilter(request, response);  // 필터 체인 통과

        } catch (LogueException e) {
            handleCustomException(response, e);
        }
    }

    @Override // 필터에 걸리지 않기 위한 경로들 추가
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.equals("/")
                || path.equals("/health") || path.equals("/error")
                || path.startsWith("/oauth2") || path.startsWith("/login/oauth2/")
                || path.startsWith("/swagger-ui/") || path.startsWith("/v3/api-docs")
                ;
    }

    private String resolveAccessToken(HttpServletRequest request) {
        String authorizationHeader  = request.getHeader(AUTHORIZATION_HEADER);

        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX))
            return null;

        return authorizationHeader.substring(BEARER_PREFIX.length());
    }

    // 인증 정보 설정 메서드
    private void setAuthentication(Long userId) {
        UserAuthentication authentication = new UserAuthentication(userId, null, null);  // 인증 객체 생성
        SecurityContextHolder.getContext().setAuthentication(authentication);  // SecurityContext에 인증 정보 저장
    }

    // 예외 처리 메서드
    private void handleCustomException(HttpServletResponse response, LogueException e) throws IOException {
        log.warn("JWT 인증 실패: {}", e.getMessage());
        response.setStatus(e.getErrorCode().getHttpStatus().value());  // 상태 코드 설정
        response.setContentType("application/json");
        String jsonResponse = String.format("{\"code\": \"%s\", \"message\": \"%s\",\"data\":null}", e.getErrorCode().getCode(), e.getErrorCode().getMessage());
        response.getWriter().write(jsonResponse);  // JSON 형식으로 예외 응답
    }

}
