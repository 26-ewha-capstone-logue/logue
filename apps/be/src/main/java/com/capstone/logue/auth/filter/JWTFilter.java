package com.capstone.logue.auth.filter;

import com.capstone.logue.auth.provider.JWTProvider;
import com.capstone.logue.auth.security.UserAuthentication;
import com.capstone.logue.auth.security.UserPrincipal;
import com.capstone.logue.global.exception.LogueException;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT 기반 인증을 처리하는 Spring Security 필터입니다.
 *
 * <p>요청 헤더의 Authorization 값에서 Bearer 토큰을 추출한 뒤,
 * 토큰 유효성을 검증하고 사용자 ID를 파싱하여
 * {@link SecurityContextHolder}에 인증 정보를 설정합니다.</p>
 *
 * <p>토큰이 없으면 인증 없이 다음 필터로 넘기며,
 * 토큰 검증 중 {@link LogueException}이 발생하면 JSON 형식의 에러 응답을 반환합니다.</p>
 */
@Slf4j
@RequiredArgsConstructor
public class JWTFilter extends OncePerRequestFilter {

    /** Authorization 헤더 이름 */
    private static final String AUTHORIZATION_HEADER = "Authorization";

    /** Bearer 토큰 접두사 */
    private static final String BEARER_PREFIX = "Bearer ";

    /** JWT 생성, 검증, 파싱을 담당하는 provider */
    private final JWTProvider jwtProvider;


    /**
     * JWT 인증 필터의 핵심 로직입니다.
     *
     * <p>요청 헤더에서 access token을 추출하고,
     * 토큰이 존재하면 유효성 검증 후 사용자 인증 정보를 SecurityContext에 저장합니다.
     * 토큰이 없으면 인증 없이 다음 필터로 넘깁니다.</p>
     *
     * @param request HTTP 요청
     * @param response HTTP 응답
     * @param filterChain 다음 필터 체인
     * @throws ServletException 서블릿 처리 중 예외 발생 시
     * @throws IOException 입출력 예외 발생 시
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        try {
            String accessToken = resolveAccessToken(request);  // Authorization 헤더에서 JWT를 가져온다.

            //토큰이 없으면 인증 없이 다음 필터로 넘김
            if (accessToken == null) {
                filterChain.doFilter(request,response);
                return;
            }

            // 파싱 1회 — validate + Claims 추출을 동시에
            Claims claims = jwtProvider.validateToken(accessToken);
            setAuthentication(claims);  // Claims 객체를 넘김
            filterChain.doFilter(request, response);  // 필터 체인 통과

        } catch (LogueException e) {
            handleCustomException(response, e);
        }
    }

    /**
     * JWT 인증 필터를 적용하지 않을 경로를 지정합니다.
     *
     * <p>루트, 헬스 체크, 에러 페이지, OAuth2 로그인 관련 경로,
     * Swagger 문서 경로 등은 JWT 인증 없이 접근할 수 있도록 제외합니다.</p>
     *
     * @param request HTTP 요청
     * @return 필터 적용 제외 여부
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.equals("/")
                || path.equals("/health") || path.equals("/error")
                || path.startsWith("/oauth2") || path.startsWith("/login/oauth2/")
                || path.startsWith("/swagger-ui/") || path.startsWith("/v3/api-docs")
                ;
    }

    /**
     * Authorization 헤더에서 Bearer access token을 추출합니다.
     *
     * <p>헤더가 없거나 Bearer 형식이 아니면 null을 반환합니다.</p>
     *
     * @param request HTTP 요청
     * @return 추출된 access token, 없으면 null
     */
    private String resolveAccessToken(HttpServletRequest request) {
        String authorizationHeader  = request.getHeader(AUTHORIZATION_HEADER);

        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX))
            return null;

        return authorizationHeader.substring(BEARER_PREFIX.length());
    }

    /**
     * 사용자 ID를 기반으로 인증 객체를 생성하고 SecurityContext에 저장합니다.
     *
     * @param claims 검증된 JWT에서 추출한 클레임 정보
     */
    private void setAuthentication(Claims claims) {
        Long userId = jwtProvider.getUserIdFromToken(claims);
        String email = jwtProvider.getEmailFromToken(claims);
        UserPrincipal principal = new UserPrincipal(userId, email);
        UserAuthentication authentication = new UserAuthentication(principal, null, null);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    /**
     * JWT 인증 과정에서 발생한 커스텀 예외를 JSON 응답으로 변환합니다.
     *
     * <p>에러 코드와 메시지를 포함한 응답 본문을 작성하며,
     * HTTP 상태 코드는 {@link LogueException}의 ErrorCode를 따릅니다.</p>
     *
     * @param response HTTP 응답
     * @param e 발생한 커스텀 예외
     * @throws IOException 응답 작성 중 예외 발생 시
     */
    private void handleCustomException(HttpServletResponse response, LogueException e) throws IOException {
        log.warn("JWT 인증 실패: {}", e.getMessage());
        response.setStatus(e.getErrorCode().getHttpStatus().value());
        response.setContentType("application/json");
        String jsonResponse = String.format("{\"code\": \"%s\", \"message\": \"%s\",\"data\":null}", e.getErrorCode().getCode(), e.getErrorCode().getMessage());
        response.getWriter().write(jsonResponse);
    }

}
