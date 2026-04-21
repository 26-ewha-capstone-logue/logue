package com.capstone.logue.data.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

/**
 * 단건 조회 응답에 포함되는 CSV 미리보기 표 데이터.
 *
 * <p>{@link #headers}의 순서에 따라 각 행({@link #rows})의 값이 정렬되어 있습니다.</p>
 *
 * @param headers 컬럼명(헤더) 목록
 * @param rows    각 행 값 배열 리스트 (헤더와 동일 순서)
 */
@Schema(description = "CSV 미리보기 표")
public record FilePreview(
        @Schema(
                description = "표 헤더(컬럼) 목록",
                example = "[\"signup_date\", \"channel\", \"device_type\", \"user_id\"]"
        )
        List<String> headers,

        @Schema(
                description = "행 배열 리스트. 각 행 배열에는 헤더와 같은 순서로 실제 값이 들어 있습니다.",
                example = "[[\"2024-01-01\", \"organic\", \"mobile\", \"u_001\"]]"
        )
        List<List<String>> rows
) {
}
