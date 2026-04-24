package com.capstone.logue.anal.dto.spring.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

public record GetSummaryRequest (
    Long dataSourceId
) {}
