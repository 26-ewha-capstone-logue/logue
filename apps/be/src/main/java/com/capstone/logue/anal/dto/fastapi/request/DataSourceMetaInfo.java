package com.capstone.logue.anal.dto.fastapi.request;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * FastAPI 파일 분석 요청 시 전달하는 데이터 소스 메타데이터입니다.
 */
public record DataSourceMetaInfo(
    @JsonProperty("file_name")
    String fileName,

    @JsonProperty("row_count")
    int rowCount,

    @JsonProperty("column_count")
    int columnCount,

    List<ColumnMetaInfo> columns
) {}
