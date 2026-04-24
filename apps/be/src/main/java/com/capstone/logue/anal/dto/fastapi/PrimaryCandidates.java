package com.capstone.logue.anal.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.util.List;

@Getter
public class PrimaryCandidates {
    @JsonProperty("date_fields")
    private List<String> dateFields;

    private List<String> measures;
    private List<String> dimensions;

    @JsonProperty("status_conditions")
    private List<String> statusConditions;

    private List<String> flags;
    private List<String> ids;
}
