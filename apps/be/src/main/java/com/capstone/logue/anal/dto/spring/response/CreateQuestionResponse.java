package com.capstone.logue.anal.dto.spring.response;

import java.time.OffsetDateTime;

/**
 * 사용자 질문 전송 응답 DTO입니다.
 */
public record CreateQuestionResponse(
        Long messageId,
        String question,
        OffsetDateTime createdAt
) {
}
