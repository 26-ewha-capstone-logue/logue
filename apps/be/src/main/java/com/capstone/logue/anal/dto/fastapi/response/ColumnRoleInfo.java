package com.capstone.logue.anal.dto.fastapi.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ColumnRoleInfo(
    @JsonProperty("column_name")
    String columnName,

    @JsonProperty("semantic_role")
    String semanticRole,

    double confidence,

    @JsonProperty("display_name")
    String displayName
) {}
