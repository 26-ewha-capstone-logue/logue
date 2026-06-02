package com.capstone.logue.auth.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

/**
 * Google OAuth2 인증 요청 시 {@code prompt=select_account} 파라미터를 주입하는 커스텀 Resolver.
 *
 * <p>Spring Security의 기본 {@link DefaultOAuth2AuthorizationRequestResolver}를 위임(delegate) 방식으로 감싸며,
 * 인증 URL 생성 후 {@code additionalParameters}에 {@code prompt} 값을 추가한다.
 *
 * <p>이를 통해 브라우저에 Google SSO 세션이 잔류하더라도 재로그인 시 항상 계정 선택 화면이 노출된다.
 *
 * <p>사용 등록: {@code SecurityConfig} 의 {@code .oauth2Login()} 설정에서
 * {@code authorizationEndpoint.authorizationRequestResolver}로 주입한다.
 */
public class CustomOAuth2AuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private final DefaultOAuth2AuthorizationRequestResolver delegate;

    /**
     * @param repository 등록된 OAuth2 클라이언트 정보를 제공하는 repository
     */
    public CustomOAuth2AuthorizationRequestResolver(ClientRegistrationRepository repository) {
        this.delegate = new DefaultOAuth2AuthorizationRequestResolver(repository, "/oauth2/authorization");
    }

    /**
     * 요청 URI에서 클라이언트 등록 ID를 추출하여 인증 요청을 생성한다.
     *
     * @param request 현재 HTTP 요청
     * @return {@code prompt=select_account}가 포함된 인증 요청, 해당 없으면 {@code null}
     */
    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        return withPrompt(delegate.resolve(request));
    }

    /**
     * 지정된 클라이언트 등록 ID로 인증 요청을 생성한다.
     *
     * @param request              현재 HTTP 요청
     * @param clientRegistrationId 사용할 OAuth2 클라이언트 등록 ID
     * @return {@code prompt=select_account}가 포함된 인증 요청, 해당 없으면 {@code null}
     */
    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        return withPrompt(delegate.resolve(request, clientRegistrationId));
    }

    /**
     * 인증 요청에 {@code prompt=select_account} 파라미터를 추가한다.
     *
     * @param authorizationRequest 원본 인증 요청, {@code null}이면 그대로 반환
     * @return {@code prompt} 파라미터가 추가된 인증 요청
     */
    private OAuth2AuthorizationRequest withPrompt(OAuth2AuthorizationRequest authorizationRequest) {
        if (authorizationRequest == null) return null;

        return OAuth2AuthorizationRequest.from(authorizationRequest)
                .additionalParameters(params -> params.put("prompt", "select_account"))
                .build();
    }
}
