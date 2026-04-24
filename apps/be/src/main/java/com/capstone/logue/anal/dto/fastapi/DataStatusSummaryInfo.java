package com.capstone.logue.anal.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DataStatusSummaryInfo(
    @JsonProperty("total_rows")
    int totalRows,

    @JsonProperty("total_columns")
    int totalColumns,

    @JsonProperty("primary_candidates")
    PrimaryCandidates primaryCandidates
) {}
