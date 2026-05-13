package com.capstone.logue.anal.dto.fastapi.request;

/**
 * FastAPI 카탈로그에 포함되는 플로우 경고 정의입니다.
 *
 * <p>{@link com.capstone.logue.global.entity.enums.FlowWarningKey} 에 대응됩니다.</p>
 */
public record FlowWarningKeyInfo(
        String code,
        String name,
        String comment
) {
}
