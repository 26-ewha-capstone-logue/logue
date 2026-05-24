package com.capstone.logue.anal.dto.fastapi.response;

import java.util.List;

/**
 * 강조 세그먼트를 포함한 자연어 요약입니다.
 *
 * <p>{@code segments} 의 텍스트를 이어붙이면 {@code plainText} 와 일치해야 합니다.</p>
 */
public record DescriptionInfo(
        List<SegmentInfo> segments,
        String plainText
) {
}
