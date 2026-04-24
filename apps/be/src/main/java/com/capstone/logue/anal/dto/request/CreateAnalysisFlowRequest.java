package com.capstone.logue.anal.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public record CreateAnalysisFlowRequest (
    Long dataSourceId
) {}
