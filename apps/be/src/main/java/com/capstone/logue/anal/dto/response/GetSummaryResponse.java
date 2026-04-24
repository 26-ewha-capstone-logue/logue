package com.capstone.logue.anal.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

public record GetSummaryResponse (
    int rowCount,

    int columnCount,

    List<String> dataCriteria,

    List<String> measure,

    List<String> dimension,

    List<String> statusCondition,

    List<String> flag,

    List<String> idCriteria,

    String sourceDataWarning,

    LocalDateTime createdAt
) {}
