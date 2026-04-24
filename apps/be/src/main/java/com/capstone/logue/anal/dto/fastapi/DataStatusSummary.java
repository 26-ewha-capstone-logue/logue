package com.capstone.logue.anal.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

public record DataStatusSummary (
    @JsonProperty("total_rows")
    int totalRows,

    @JsonProperty("total_columns")
    int totalColumns,

    @JsonProperty("primary_candidates")
    PrimaryCandidates primaryCandidates
) {}
