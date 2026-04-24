package com.capstone.logue.anal.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class Catalog {
    @JsonProperty("semantic_roles")
    private List<String> semanticRoles;

    @JsonProperty("source_warning_keys")
    private List<SourceWarningKeyDto> sourceWarningKeys;
}
