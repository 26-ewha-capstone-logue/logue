package com.capstone.logue.anal.dto.fastapi.request;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * FastAPI POST /v1/llm/data-sources/analyze 요청 DTO입니다.
 */
public record FileAnalysisRequest (
    Long requestId,

    DataSourceMetaInfo dataSource,

    CatalogInfo catalog
) {}
