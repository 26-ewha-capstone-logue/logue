package com.capstone.logue.anal.dto.request;

import lombok.Builder;
import lombok.Getter;

public record SourceWarningKeyDto (
    String code,
    String name,
    String comment
) {}
