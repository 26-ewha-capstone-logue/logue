package com.capstone.logue.anal.dto.fastapi.response;

import java.util.List;

/**
 * 분석 기준 도출 과정에서 발생한 플로우 수준 경고입니다.
 *
 * <p>{@code code} 는 {@link com.capstone.logue.global.entity.enums.FlowWarningKey} 와 매핑됩니다.</p>
 */
public record FlowWarningInfo(
        String code,
        List<String> relatedFields,
        String detail
) {
}
