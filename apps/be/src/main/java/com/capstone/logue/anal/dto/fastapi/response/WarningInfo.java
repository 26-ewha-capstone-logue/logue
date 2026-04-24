package com.capstone.logue.anal.dto.fastapi.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record WarningInfo(
    String code,

    List<String> relatedColumns
) {}
