package com.capstone.logue.anal.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.util.List;

/**
 * FastAPI POST /v1/llm/data-sources/analyze 응답 DTO입니다.
 */
@Getter
public class FileAnalysisResponse {
    @JsonProperty("request_id")
    private String requestId;

    @JsonProperty("column_roles")
    private List<ColumnRole> columnRoles;

    @JsonProperty("data_status_summary")
    private DataStatusSummary dataStatusSummary;

    private List<Warning> warnings;
}
