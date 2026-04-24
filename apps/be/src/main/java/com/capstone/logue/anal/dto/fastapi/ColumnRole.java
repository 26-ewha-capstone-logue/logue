package com.capstone.logue.anal.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public class ColumnRole {
    @JsonProperty("column_name")
    private String columnName;

    @JsonProperty("semantic_role")
    private String semanticRole;

    private double confidence;

    @JsonProperty("display_name")
    private String displayName;
}
