package com.capstone.logue.user.controller;

import com.capstone.logue.auth.provider.JWTProvider;
import com.capstone.logue.global.config.SecurityConfig;
import com.capstone.logue.global.entity.User;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.capstone.logue.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;

import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;


/**
 * {@link UserController}의 GET /api/user/me API에 대한 슬라이스 테스트입니다.
 *
 * <p>{@link WebMvcTest}를 사용하여 DB 연결 없이 웹 레이어만 로드하며,
 * {@link JWTProvider}와 {@link UserRepository}는 Mockito로 대체합니다.</p>
 *
 * <p>검증 대상:</p>
 * <ul>
 *   <li>JWT 필터 → {@code @CurrentUser} 주입 → 컨트롤러 실행까지의 전체 인증 흐름</li>
 *   <li>토큰 유효성에 따른 HTTP 상태 코드 분기</li>
 *   <li>사용자 조회 성공/실패에 따른 응답 처리</li>
 * </ul>
 */
@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private JWTProvider jwtProvider;

    // SecurityConfig가 OAuth2 핸들러를 주입받으므로 MockBean 필요
    @MockitoBean
    private com.capstone.logue.auth.handler.OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    @MockitoBean
    private com.capstone.logue.auth.handler.OAuth2LoginFailureHandler oAuth2LoginFailureHandler;

    @MockitoBean
    private com.capstone.logue.global.discord.DiscordWebhookService discordWebhookService;

    private static final Long USER_ID = 1L;
    private static final String VALID_TOKEN = "valid-token";

    // 성공 케이스 공통으로 쓸 Claims mock 생성 헬퍼
    private Claims mockClaims(Long userId, String email) {
        Claims claims = mock(Claims.class);
        when(claims.get("userId", Long.class)).thenReturn(userId);
        when(claims.get("email", String.class)).thenReturn(email);
        return claims;
    }

    /**
     * 유효한 JWT 토큰으로 요청 시 사용자 정보를 정상 반환하는지 검증합니다.
     *
     * <p>JWTFilter가 토큰을 파싱하여 userId를 추출하고,
     * {@code @CurrentUser}를 통해 컨트롤러 파라미터에 주입된 뒤
     * DB에서 사용자를 조회하여 200 응답을 반환하는 전체 흐름을 검증합니다.</p>
     */
    @Test
    @DisplayName("유효한 토큰으로 요청 시 사용자 정보를 반환한다")
    void getMyInfo_validToken_returns200() throws Exception {
        // given
        Claims claims = mockClaims(USER_ID, "test@test.com");

        User user = User.builder()
                .id(USER_ID)
                .email("test@test.com")
                .name("테스터")
                .provider("GOOGLE")         // ← 추가
                .profileImageUrl(null)      // ← null이면 생략해도 되지만 명시하는 게 안전
                .build();

        when(jwtProvider.validateToken(VALID_TOKEN)).thenReturn(claims); // ✅ Claims 반환
        when(jwtProvider.getUserIdFromToken(claims)).thenReturn(USER_ID);
        when(jwtProvider.getEmailFromToken(claims)).thenReturn("test@test.com");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        // when & then
        mockMvc.perform(get("/api/user/me")
                        .header("Authorization", "Bearer " + VALID_TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("test@test.com"));
    }


    /**
     * JWT 토큰은 유효하지만 해당 userId를 가진 사용자가 DB에 없을 때 404를 반환하는지 검증합니다.
     *
     * <p>토큰 탈취 후 계정이 삭제된 경우 등 인증은 통과했으나
     * 사용자를 찾을 수 없는 예외 상황을 커버합니다.</p>
     */
    @Test
    @DisplayName("유효한 토큰이지만 DB에 유저가 없으면 404를 반환한다")
    void getMyInfo_userNotFound_returns404() throws Exception {
        // given
        Claims claims = mockClaims(USER_ID, "test@test.com");

        when(jwtProvider.validateToken(VALID_TOKEN)).thenReturn(claims);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        // when & then
        mockMvc.perform(get("/api/user/me")
                        .header("Authorization", "Bearer " + VALID_TOKEN))
                .andExpect(status().isNotFound());
    }


    /**
     * 토큰 없이 요청 시 OAuth2 로그인 페이지로 리다이렉트(302)되는지 검증합니다.
     *
     * <p>미인증 요청에 대해 Spring Security가 OAuth2 인증 흐름으로
     * 리다이렉트하는 기본 동작을 검증합니다.</p>
     */
    @Test
    @DisplayName("토큰 없이 요청 시 OAuth2 로그인 페이지로 리다이렉트된다")
    @WithAnonymousUser
    void getMyInfo_noToken_returns302() throws Exception {
        mockMvc.perform(get("/api/user/me"))
                .andExpect(status().is3xxRedirection());
    }


    /**
     * 만료된 JWT 토큰으로 요청 시 401을 반환하는지 검증합니다.
     *
     * <p>JWTFilter가 토큰 검증 중 {@link LogueException}(EXPIRED_TOKEN)을 발생시키면
     * 필터 내부에서 직접 JSON 에러 응답을 작성하여 401을 반환하는 흐름을 검증합니다.</p>
     */
    @Test
    @DisplayName("만료된 토큰으로 요청 시 401을 반환한다")
    void getMyInfo_expiredToken_returns401() throws Exception {
        // given
        when(jwtProvider.validateToken("expired-token"))
                .thenThrow(new LogueException(ErrorCode.EXPIRED_TOKEN));

        // when & then
        mockMvc.perform(get("/api/user/me")
                        .header("Authorization", "Bearer expired-token"))
                .andExpect(status().isUnauthorized());
    }
}