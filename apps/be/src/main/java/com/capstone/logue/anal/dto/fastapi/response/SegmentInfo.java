package com.capstone.logue.anal.dto.fastapi.response;

/**
 * 자연어 요약 텍스트의 단일 세그먼트입니다.
 *
 * <p>{@code emphasis=true} 인 세그먼트는 UI 에서 강조(주황색 등) 처리됩니다.</p>
 */
public record SegmentInfo(
        String text,
        boolean emphasis
) {
}
