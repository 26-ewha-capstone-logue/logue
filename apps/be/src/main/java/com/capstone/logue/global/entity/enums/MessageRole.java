package com.capstone.logue.global.entity.enums;

/**
 * 대화 메시지의 발신 주체를 구분하는 역할 값입니다.
 *
 * <ul>
 *   <li>{@link #USER} - 사용자가 보낸 메시지입니다.</li>
 *   <li>{@link #LOGUE} - Logue AI가 보낸 응답 메시지입니다.</li>
 * </ul>
 */
public enum MessageRole {
    USER,
    LOGUE
}
