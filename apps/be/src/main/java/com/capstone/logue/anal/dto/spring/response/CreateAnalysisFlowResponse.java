package com.capstone.logue.anal.dto.spring.response;

import java.time.OffsetDateTime;

public record CreateAnalysisFlowResponse (
    Long analysisFlowId,
    Long dataSourceId,
    OffsetDateTime createdAt
) {}
