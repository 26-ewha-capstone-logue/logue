package com.capstone.logue.anal.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

public record ColumnRole(
    @JsonProperty("column_name")
    String columnName,

    @JsonProperty("semantic_role")
    String semanticRole,

    double confidence,

    @JsonProperty("display_name")
    String displayName
) {}
