package com.capstone.logue.anal.dto.fastapi.request;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * FastAPI 파일 분석 요청 시 전달하는 단일 컬럼 메타데이터입니다.
 */
public record ColumnMeta (
    @JsonProperty("column_name")
    String columnName,

    @JsonProperty("data_type")
    String dataType,

    @JsonProperty("null_ratio")
    double nullRatio,

    @JsonProperty("unique_ratio")
    double uniqueRatio,

    @JsonProperty("sample_values")
    List<String> sampleValues
) {}
