package com.capstone.logue.anal.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * FastAPI POST /v1/llm/data-sources/analyze 응답 DTO입니다.
 */
public record FileAnalysisResponse (
    @JsonProperty("request_id")
    String requestId,

    @JsonProperty("column_roles")
    List<ColumnRoleInfo> columnRoles,

    @JsonProperty("data_status_summary")
    DataStatusSummary dataStatusSummary,

    List<WarningInfo> warnings
) {}
