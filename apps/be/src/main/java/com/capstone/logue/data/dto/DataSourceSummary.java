package com.capstone.logue.data.dto;

import com.capstone.logue.global.entity.DataSource;
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

    /**
     * {@link DataSource} 엔티티에서 요약 DTO 로 변환합니다.
     *
     * <p>엔티티의 {@code createdAt} 이 누락된 (예: 테스트 환경) 경우 {@code uploadedAt} 은
     * {@code null} 로 세팅되어 매핑 실패를 회피합니다.</p>
     *
     * @param dataSource 변환할 DataSource 엔티티
     * @return 목록 응답에 포함될 요약 항목
     */
    public static DataSourceSummary from(DataSource dataSource) {
        return new DataSourceSummary(
                dataSource.getId(),
                dataSource.getFileName(),
                dataSource.getFileSize(),
                dataSource.getCreatedAt() == null ? null : dataSource.getCreatedAt().toInstant()
        );
    }
}
