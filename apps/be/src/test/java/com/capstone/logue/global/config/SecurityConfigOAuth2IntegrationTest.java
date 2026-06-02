package com.capstone.logue.global.config;

import com.capstone.logue.auth.handler.OAuth2LoginFailureHandler;
import com.capstone.logue.auth.handler.OAuth2LoginSuccessHandler;
import com.capstone.logue.auth.provider.JWTProvider;
import com.capstone.logue.global.discord.DiscordWebhookService;
import com.capstone.logue.user.controller.UserController;
import com.capstone.logue.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SecurityConfig의 oauth2Login 설정에서
 * CustomOAuth2AuthorizationRequestResolver가 올바르게 등록되어
 * Google 인증 리다이렉트 URL에 prompt=select_account가 포함되는지 검증합니다.
 */
@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
class SecurityConfigOAuth2IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private JWTProvider jwtProvider;

    @MockitoBean
    private OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    @MockitoBean
    private OAuth2LoginFailureHandler oAuth2LoginFailureHandler;

    @MockitoBean
    private DiscordWebhookService discordWebhookService;

    @Test
    @DisplayName("GET /oauth2/authorization/google 리다이렉트 URL에 prompt=select_account가 포함된다")
    void oauth2AuthorizationRequest_containsPromptSelectAccount() throws Exception {
        mockMvc.perform(get("/oauth2/authorization/google"))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", containsString("prompt=select_account")));
    }
}
