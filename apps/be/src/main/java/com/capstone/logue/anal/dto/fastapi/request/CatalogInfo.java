package com.capstone.logue.anal.dto.fastapi.request;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record CatalogInfo(
    List<String> semanticRoles,

    List<SourceWarningKeyInfo> sourceWarningKeys
) {}
