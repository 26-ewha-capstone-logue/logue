package com.capstone.logue.anal.dto.fastapi.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record PrimaryCandidatesInfo(
    List<String> dateFields,

    List<String> measures,
    List<String> dimensions,

    List<String> statusConditions,

    List<String> flags,
    List<String> ids
) {}
