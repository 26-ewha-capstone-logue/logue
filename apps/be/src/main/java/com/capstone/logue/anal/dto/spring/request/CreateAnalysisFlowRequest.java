package com.capstone.logue.anal.dto.spring.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public record CreateAnalysisFlowRequest (
    @NotNull(message = "dataSourceId must not be null")
    Long dataSourceId
) {}
