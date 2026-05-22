package com.capstone.logue.anal.dto.spring.response;

public record GetSummaryStatusResponse (

    String status  // QUEUED / RUNNING / SUCCESS / FAILED
) {}
