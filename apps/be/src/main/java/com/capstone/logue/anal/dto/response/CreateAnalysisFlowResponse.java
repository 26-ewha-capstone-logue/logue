package com.capstone.logue.anal.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
@Builder
public class CreateAnalysisFlowResponse {
    private Long analysisFlowId;
    private Long dataSourceId;
    private OffsetDateTime createdAt;
}
