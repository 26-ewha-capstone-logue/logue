package com.capstone.logue.anal.dto.response;

import lombok.Builder;
import lombok.Getter;

public record GetSummaryStatusResponse (

    String status  // QUEUED / RUNNING / SUCCESS / FAILED
) {}
