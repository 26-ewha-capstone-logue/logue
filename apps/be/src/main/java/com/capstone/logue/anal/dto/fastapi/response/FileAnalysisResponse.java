package com.capstone.logue.anal.dto.fastapi.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * FastAPI POST /v1/llm/data-sources/analyze 응답 DTO입니다.
 */
public record FileAnalysisResponse (
    String requestId,

    List<ColumnRoleInfo> columnRoles,

    DataStatusSummaryInfo dataStatusSummary,

    List<WarningInfo> warnings
) {}
