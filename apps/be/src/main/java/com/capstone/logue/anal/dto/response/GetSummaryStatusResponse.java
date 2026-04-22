package com.capstone.logue.anal.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GetSummaryStatusResponse {

    private String status;  // QUEUED / RUNNING / SUCCESS / FAILED
}
