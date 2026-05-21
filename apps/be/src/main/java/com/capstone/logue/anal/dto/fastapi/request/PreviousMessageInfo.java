package com.capstone.logue.anal.dto.fastapi.request;

/**
 * 같은 플로우의 이전 메시지를 표현하는 record입니다.
 * role 은 USER / LOGUE 문자열입니다.
 */
public record PreviousMessageInfo(
        String role,
        String content
) {
}
