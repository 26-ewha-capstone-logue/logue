package com.capstone.logue.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "C001", "잘못된 입력입니다."),
    INVALID_TYPE(HttpStatus.BAD_REQUEST, "C002", "잘못된 타입입니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "C003", "지원하지 않는 HTTP 메서드입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C004", "서버 내부 오류가 발생했습니다."),

    // Auth
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "A001", "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "A002", "접근 권한이 없습니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "A003", "만료된 토큰입니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "A004", "유효하지 않은 토큰입니다."),
    UNSUPPORTED_OAUTH_PROVIDER(HttpStatus.BAD_REQUEST, "A005", "지원하지 않는 OAuth Provider입니다."),

    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U001", "사용자를 찾을 수 없습니다."),

    // DataSource
    DATASOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "D001", "데이터 소스를 찾을 수 없습니다."),
    DATASOURCE_FORBIDDEN(HttpStatus.FORBIDDEN, "D002", "해당 데이터 소스에 대한 접근 권한이 없습니다."),
    DATASOURCE_INVALID_FILE(HttpStatus.BAD_REQUEST, "D003", "올바르지 않은 CSV 파일입니다."),
    DATASOURCE_STORAGE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "D004", "데이터 소스 파일 저장/읽기에 실패했습니다."),
    DATASOURCE_INVALID_PAGE_PARAM(HttpStatus.BAD_REQUEST, "D005", "잘못된 페이지 요청 파라미터입니다."),
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
