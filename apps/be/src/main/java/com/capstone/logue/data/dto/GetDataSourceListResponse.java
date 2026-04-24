package com.capstone.logue.data.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

/**
 * 목록 조회({@code GET /api/datasources}) 응답 payload.
 *
 * <p>정렬 기준과 페이지네이션 메타를 함께 반환하며, {@link DataSourceSummary} 리스트로
 * 현재 페이지의 항목들을 담습니다.</p>
 *
 * @param sort        적용된 정렬 기준
 * @param page        현재 페이지 번호 (0-base)
 * @param size        페이지당 항목 수
 * @param totalPages  전체 페이지 수
 * @param dataSources 현재 페이지에 해당하는 DataSource 요약 목록 (없으면 빈 배열)
 */
@Schema(description = "DataSource 목록 조회 응답 본문")
public record GetDataSourceListResponse(
        @Schema(description = "적용된 정렬 기준", example = "LATEST")
        SortType sort,

        @Schema(description = "현재 페이지 번호 (0-base)", example = "0")
        int page,

        @Schema(description = "페이지당 항목 수", example = "20")
        int size,

        @Schema(description = "전체 페이지 수", example = "5")
        int totalPages,

        @Schema(description = "현재 페이지의 DataSource 목록. 비어 있을 경우 빈 배열.")
        List<DataSourceSummary> dataSources
) {
}
