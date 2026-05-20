package com.capstone.logue.anal.dto.spring.request;

import jakarta.validation.constraints.NotBlank;

/**
 * 사용자 질문 전송 API 요청 DTO입니다.
 */
public record CreateQuestionRequest(
        @NotBlank(message = "question must not be blank")
        String question
) {
}
