package com.capstone.logue.data.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * CSV 업로드 성공 응답 payload.
 *
 * <p>업로드된 DataSource의 식별자만 반환합니다. 상세 정보는 단건 조회 API에서 확인합니다.</p>
 *
 * @param dataSourceId 생성된 DataSource의 식별자
 */
@Schema(description = "CSV 업로드 응답 본문")
public record UploadFileResponse(
        @Schema(description = "업로드한 파일의 dataSource 식별자", example = "1")
        Long dataSourceId
) {
}
