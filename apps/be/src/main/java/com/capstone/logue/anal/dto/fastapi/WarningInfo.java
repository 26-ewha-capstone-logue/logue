package com.capstone.logue.anal.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record WarningInfo(
    String code,

    @JsonProperty("related_columns")
    List<String> relatedColumns
) {}
