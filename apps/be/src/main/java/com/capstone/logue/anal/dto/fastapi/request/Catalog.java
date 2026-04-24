package com.capstone.logue.anal.dto.fastapi.request;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record Catalog (
    @JsonProperty("semantic_roles")
    List<String> semanticRoles,

    @JsonProperty("source_warning_keys")
    List<SourceWarningKeyDto> sourceWarningKeys
) {}
