package com.capstone.logue.global.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.capstone.logue.global.discord.DiscordWebhookService;
import com.capstone.logue.global.response.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    @Mock private DiscordWebhookService discordWebhookService;

    @Test
    @DisplayName("ConstraintViolationException 발생 시 400 INVALID_INPUT 응답을 반환한다")
    void handleConstraintViolation_returns400InvalidInput() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler(discordWebhookService);
        ConstraintViolationException exception =
                new ConstraintViolationException("must be greater than or equal to 1", Set.of());

        ResponseEntity<ApiResponse<Void>> response = handler.handleConstraintViolation(exception);

        assertThat(response.getStatusCode()).isEqualTo(ErrorCode.INVALID_INPUT.getHttpStatus());
        ApiResponse<Void> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.isSuccess()).isFalse();
        assertThat(body.getCode()).isEqualTo(ErrorCode.INVALID_INPUT.getCode());
        assertThat(body.getMessage()).isEqualTo(ErrorCode.INVALID_INPUT.getMessage());
    }
}
