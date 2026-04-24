package com.capstone.logue.anal.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.util.List;

@Getter
public class Warning {
    private String code;

    @JsonProperty("related_columns")
    private List<String> relatedColumns;
}
