package com.capstone.logue.auth.handler;

import com.capstone.logue.auth.provider.JWTProvider;
import com.capstone.logue.global.entity.User;
import com.capstone.logue.auth.dto.GoogleUserInfo;
import com.capstone.logue.auth.dto.OAuth2UserInfo;
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

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Value("${spring.jwt.redirect.onboarding}")
    private String REDIRECT_URI_ONBOARDING;
    @Value("${spring.jwt.redirect.base}")
    private String REDIRECT_URI_BASE;

//    @Value("${spring.jwt.register-token.expiration-time}")
//    private long REGISTER_TOKEN_EXPIRATION_TIME;
    @Value("${spring.jwt.access-token.expiration-time}")
    private long ACCESS_TOKEN_EXPIRATION_TIME;
//    @Value("${spring.jwt.refresh-token.expiration-time}")
//    private long REFRESH_TOKEN_EXPIRATION_TIME;

    private final JWTProvider jwtProvider;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        final String provider = token.getAuthorizedClientRegistrationId();
        final Map<String, Object> attributes = token.getPrincipal().getAttributes();

        OAuth2UserInfo oAuth2UserInfo;
        switch (provider) {
            case "google" -> oAuth2UserInfo = new GoogleUserInfo(attributes);
            default ->  throw new IllegalArgumentException("지원하지 않는 OAuth provider입니다: " + provider);
        }

        String providerId = oAuth2UserInfo.getProviderId();
        String email = oAuth2UserInfo.getEmail();
        String profileImageUrl = oAuth2UserInfo.getProfileImageUrl();

        log.info("OAuth 로그인 성공. providerId = {}", providerId);
        log.info("email = {}", email);

        User existUser = userRepository.findByProviderId(providerId);
        if (existUser == null) {
            log.info("신규 유저입니다. provider={}, providerId={}", provider, providerId);

            String redirectUrl = UriComponentsBuilder
                    .fromUriString(REDIRECT_URI_ONBOARDING)
                    .queryParam("provider", provider)
                    .queryParam("providerId", providerId)
                    .queryParam("email", email)
                    .queryParam("profileImageUrl", profileImageUrl)
                    .build()
                    .toUriString();

            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        } else {
            log.info("기존 유저입니다. userId={}", existUser.getId());

            String accessToken = jwtProvider.generateToken(existUser.getId(), ACCESS_TOKEN_EXPIRATION_TIME);

            String redirectUrl = UriComponentsBuilder
                    .fromUriString(REDIRECT_URI_BASE)
                    .queryParam("accessToken", accessToken)
                    .build()
                    .toUriString();

            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        }

    }
}
