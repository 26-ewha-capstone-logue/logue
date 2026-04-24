package com.capstone.logue.anal.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * FastAPI 파일 분석 요청 시 전달하는 단일 컬럼 메타데이터입니다.
 */
@Getter
@Builder
public class ColumnMeta {
    @JsonProperty("column_name")
    private String columnName;

    @JsonProperty("data_type")
    private String dataType;

    @JsonProperty("null_ratio")
    private double nullRatio;

    @JsonProperty("unique_ratio")
    private double uniqueRatio;

    @JsonProperty("sample_values")
    private List<String> sampleValues;
}
