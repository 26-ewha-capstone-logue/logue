package com.capstone.logue.anal.dto.fastapi.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ColumnRoleInfo(
    String columnName,

    String semanticRole,

    double confidence,

    String displayName
) {}
