package com.capstone.logue.data.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

/**
 * 목록 조회 응답에 포함되는 DataSource 요약 항목.
 *
 * <p>파일 식별자와 최소 메타데이터만 담으며, 미리보기·스키마 정보는 포함하지 않습니다.</p>
 *
 * @param dataSourceId 데이터 소스 식별자
 * @param fileName     확장자를 포함한 원본 파일명
 * @param fileSize     파일 크기 (bytes)
 * @param uploadedAt   업로드 시각 (ISO-8601 UTC)
 */
@Schema(description = "DataSource 목록 항목")
public record DataSourceSummary(
        @Schema(description = "데이터 소스 식별자", example = "1")
        Long dataSourceId,

        @Schema(description = "파일 이름", example = "파일명.csv")
        String fileName,

        @Schema(description = "파일 크기(bytes)", example = "50000000")
        Long fileSize,

        @Schema(description = "업로드 시간 (ISO UTC)", example = "2026-04-10T15:00:00Z")
        Instant uploadedAt
) {
}
