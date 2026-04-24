package com.capstone.logue.anal.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.util.List;

public record PrimaryCandidates (
    @JsonProperty("date_fields")
    List<String> dateFields,

    List<String> measures,
    List<String> dimensions,

    @JsonProperty("status_conditions")
    List<String> statusConditions,

    List<String> flags,
    List<String> ids
) {}
