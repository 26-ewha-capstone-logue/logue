package com.capstone.logue.global.exception;

import lombok.Getter;

@Getter
public class LogueException extends RuntimeException {

    private final ErrorCode errorCode;

    public LogueException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
