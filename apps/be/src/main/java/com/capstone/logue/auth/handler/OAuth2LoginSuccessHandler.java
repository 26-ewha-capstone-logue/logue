package com.capstone.logue.auth.handler;

import com.capstone.logue.auth.provider.JWTProvider;
import com.capstone.logue.global.entity.User;
import com.capstone.logue.auth.dto.GoogleUserInfo;
import com.capstone.logue.auth.dto.OAuth2UserInfo;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.capstone.logue.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;

/**
 * OAuth2 로그인 성공 시 후속 처리를 담당하는 핸들러입니다.
 *
 * <p>인증된 OAuth2 사용자 정보를 provider별 DTO로 변환한 뒤,
 * 기존 회원 여부를 조회하여 다음과 같이 분기 처리합니다.</p>
 *
 * <ul>
 *     <li>신규 사용자: 온보딩 페이지로 리다이렉트</li>
 *     <li>기존 사용자: access token 발급 후 메인 페이지로 리다이렉트</li>
 * </ul>
 *
 * <p>현재는 Google OAuth2 로그인을 지원하며,
 * provider별 사용자 정보 파싱은 {@link OAuth2UserInfo} 구현체를 통해 수행합니다.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    /** 신규 사용자 온보딩 페이지 리다이렉트 URI */
    @Value("${spring.jwt.redirect.onboarding}")
    private String REDIRECT_URI_ONBOARDING;

    /** 기존 사용자 로그인 성공 후 리다이렉트할 기본 URI */
    @Value("${spring.jwt.redirect.base}")
    private String REDIRECT_URI_BASE;

    /** access token 만료 시간 */
    @Value("${spring.jwt.access-token.expiration-time}")
    private long ACCESS_TOKEN_EXPIRATION_TIME;


    /** JWT 생성 및 파싱을 담당하는 provider */
    private final JWTProvider jwtProvider;

    /** 사용자 조회를 위한 repository */
    private final UserRepository userRepository;


    /**
     * OAuth2 로그인 성공 시 호출되는 메서드입니다.
     *
     * <p>OAuth2 인증 객체에서 provider와 사용자 속성을 추출한 뒤,
     * provider에 맞는 {@link OAuth2UserInfo} 구현체로 변환합니다.
     * 이후 pproviderUserId를 기준으로 기존 회원 여부를 조회하여 다음과 같이 처리합니다.</p>
     *
     * <ul>
     *     <li>신규 사용자이면 온보딩 페이지로 리다이렉트</li>
     *     <li>기존 사용자이면 access token을 발급하여 메인 페이지로 리다이렉트</li>
     * </ul>
     *
     * @param request HTTP 요청
     * @param response HTTP 응답
     * @param authentication Spring Security 인증 객체
     * @throws IOException 리다이렉트 처리 중 입출력 예외 발생 시
     */
    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        final String provider = token.getAuthorizedClientRegistrationId();
        final Map<String, Object> attributes = token.getPrincipal().getAttributes();

        OAuth2UserInfo oAuth2UserInfo;
        switch (provider) {
            case "google" -> oAuth2UserInfo = new GoogleUserInfo(attributes);
            default -> throw new LogueException(ErrorCode.UNSUPPORTED_OAUTH_PROVIDER);
        }

        String providerUserId = oAuth2UserInfo.getProviderUserId();
        String email = oAuth2UserInfo.getEmail();
        String profileImageUrl = oAuth2UserInfo.getProfileImageUrl();

        log.info("OAuth 로그인 성공. providerUserId = {}", providerUserId);
        log.info("email = {}", email);

        Optional<User> optionalUser = userRepository.findByProviderUserId(providerUserId);
        if (optionalUser.isEmpty()) {
            log.info("신규 유저입니다. provider={}, providerUserId={}", provider, providerUserId);

            String redirectUrl = UriComponentsBuilder
                    .fromUriString(REDIRECT_URI_ONBOARDING)
                    .queryParam("provider", provider)
                    .queryParam("providerUserId", providerUserId)
                    .queryParam("email", email)
                    .queryParam("profileImageUrl", profileImageUrl)
                    .build()
                    .toUriString();

            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        } else {
            User existUser = optionalUser.get();
            log.info("기존 유저입니다. userId={}", existUser.getId());

            String accessToken = jwtProvider.generateToken(existUser.getId(), existUser.getEmail(), ACCESS_TOKEN_EXPIRATION_TIME);

            String redirectUrl = UriComponentsBuilder
                    .fromUriString(REDIRECT_URI_BASE)
                    .queryParam("accessToken", accessToken)
                    .build()
                    .toUriString();

            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        }

    }
}
