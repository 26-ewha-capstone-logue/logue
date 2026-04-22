package com.capstone.logue.anal.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class GetSummaryResponse {
    private int rowCount;

    private int columnCount;

    private List<String> dataCriteria;

    private List<String> measure;

    private List<String> dimension;

    private List<String> statusCondition;

    private List<String> flag;

    private List<String> idCriteria;

    private String sourceDataWarning;

    private LocalDateTime createdAt;
}
