package com.capstone.logue.auth.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomOAuth2AuthorizationRequestResolverTest {

    @Mock
    private ClientRegistrationRepository clientRegistrationRepository;

    private CustomOAuth2AuthorizationRequestResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new CustomOAuth2AuthorizationRequestResolver(clientRegistrationRepository);
    }

    private ClientRegistration googleRegistration() {
        return ClientRegistration.withRegistrationId("google")
                .clientId("google-client-id")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .authorizationUri("https://accounts.google.com/o/oauth2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
                .userNameAttributeName("sub")
                .scope("openid", "email", "profile")
                .build();
    }

    private ClientRegistration githubRegistration() {
        return ClientRegistration.withRegistrationId("github")
                .clientId("github-client-id")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .authorizationUri("https://github.com/login/oauth/authorize")
                .tokenUri("https://github.com/login/oauth/access_token")
                .userInfoUri("https://api.github.com/user")
                .userNameAttributeName("id")
                .scope("read:user")
                .build();
    }

    private MockHttpServletRequest requestFor(String registrationId) {
        MockHttpServletRequest request = new MockHttpServletRequest(
                "GET", "/oauth2/authorization/" + registrationId);
        request.setScheme("http");
        request.setServerName("localhost");
        request.setServerPort(8080);
        return request;
    }

    @Test
    @DisplayName("resolve(request): Google 경로 요청이면 prompt=select_account가 추가된다")
    void resolve_withGoogleRequest_addsPrompt() {
        when(clientRegistrationRepository.findByRegistrationId("google"))
                .thenReturn(googleRegistration());

        OAuth2AuthorizationRequest result = resolver.resolve(requestFor("google"));

        assertThat(result).isNotNull();
        assertThat(result.getAdditionalParameters()).containsEntry("prompt", "select_account");
    }

    @Test
    @DisplayName("resolve(request): 매칭되지 않는 경로면 null을 반환한다")
    void resolve_withNonMatchingPath_returnsNull() {
        OAuth2AuthorizationRequest result = resolver.resolve(
                new MockHttpServletRequest("GET", "/some/other/path"));

        assertThat(result).isNull();
    }

    @Test
    @DisplayName("resolve(request, registrationId): Google ID면 prompt=select_account가 추가된다")
    void resolveWithRegistrationId_withGoogleId_addsPrompt() {
        when(clientRegistrationRepository.findByRegistrationId("google"))
                .thenReturn(googleRegistration());

        OAuth2AuthorizationRequest result = resolver.resolve(requestFor("google"), "google");

        assertThat(result).isNotNull();
        assertThat(result.getAdditionalParameters()).containsEntry("prompt", "select_account");
    }

    @Test
    @DisplayName("resolve(request, registrationId): Google이 아닌 ID면 prompt 파라미터를 추가하지 않는다")
    void resolveWithRegistrationId_withNonGoogleId_doesNotAddPrompt() {
        when(clientRegistrationRepository.findByRegistrationId("github"))
                .thenReturn(githubRegistration());

        OAuth2AuthorizationRequest result = resolver.resolve(requestFor("github"), "github");

        assertThat(result).isNotNull();
        assertThat(result.getAdditionalParameters()).doesNotContainKey("prompt");
    }
}
