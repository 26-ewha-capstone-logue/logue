package com.capstone.logue.anal.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * FastAPI 파일 분석 요청 시 전달하는 데이터 소스 메타데이터입니다.
 */
@Getter
@Builder
public class DataSourceMeta {
    @JsonProperty("file_name")
    private String fileName;

    @JsonProperty("row_count")
    private int rowCount;

    @JsonProperty("column_count")
    private int columnCount;

    private List<ColumnMeta> columns;
}
