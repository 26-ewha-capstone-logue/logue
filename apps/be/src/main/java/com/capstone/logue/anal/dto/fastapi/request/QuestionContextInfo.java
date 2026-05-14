package com.capstone.logue.anal.dto.fastapi.request;

import java.util.List;

/**
 * 질문 원문과 이전 메시지 맥락을 묶은 컨텍스트 정보입니다.
 */
public record QuestionContextInfo(
        String content,
        List<PreviousMessageInfo> previousMessages
) {
}
