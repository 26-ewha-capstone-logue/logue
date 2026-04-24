package com.capstone.logue.anal.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.util.List;

public record Warning (
    String code,

    @JsonProperty("related_columns")
    List<String> relatedColumns
) {}
