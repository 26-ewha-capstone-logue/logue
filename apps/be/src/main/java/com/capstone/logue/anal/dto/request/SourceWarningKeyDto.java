package com.capstone.logue.anal.dto.request;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SourceWarningKeyDto {
    private String code;
    private String name;
    private String comment;
}
