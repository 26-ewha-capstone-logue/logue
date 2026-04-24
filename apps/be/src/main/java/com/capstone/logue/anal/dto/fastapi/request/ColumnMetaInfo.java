package com.capstone.logue.anal.dto.fastapi.request;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * FastAPI 파일 분석 요청 시 전달하는 단일 컬럼 메타데이터입니다.
 */
public record ColumnMetaInfo(
    String columnName,

    String dataType,

    double nullRatio,

    double uniqueRatio,

    List<String> sampleValues
) {}
