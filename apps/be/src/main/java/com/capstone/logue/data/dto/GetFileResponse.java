package com.capstone.logue.data.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

/**
 * 단건 조회({@code GET /api/datasources/{dataSourceId}}) 응답 payload.
 *
 * <p>파일 자체의 메타데이터와 함께, 업로드 시 추출된 CSV 미리보기 표({@link FilePreview})를 반환합니다.</p>
 *
 * @param fileName   확장자를 포함한 원본 파일명
 * @param fileSize   파일 크기 (bytes)
 * @param uploadedAt 업로드 시각 (ISO-8601 UTC)
 * @param preview    미리보기를 위한 표 데이터
 */
@Schema(description = "DataSource 단건 조회 응답 본문")
public record GetFileResponse(
        @Schema(description = "파일 이름", example = "파일명.csv")
        String fileName,

        @Schema(description = "파일 크기(bytes)", example = "50000000")
        Long fileSize,

        @Schema(description = "업로드 시간 (ISO UTC)", example = "2026-04-10T15:00:00Z")
        Instant uploadedAt,

        @Schema(description = "미리보기용 표 데이터. 업로드 시 추출된 헤더/행 정보를 담습니다.")
        FilePreview preview
) {
}
