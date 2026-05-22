package com.capstone.logue.anal.dto.fastapi.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DataStatusSummaryInfo(
    int totalRows,

    int totalColumns,

    PrimaryCandidatesInfo primaryCandidates
) {}
