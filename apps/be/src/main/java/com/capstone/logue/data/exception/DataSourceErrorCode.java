package com.capstone.logue.data.exception;

import com.capstone.logue.global.exception.ErrorCode;

/**
 * DataSource 도메인 전용 에러 코드 참조 유틸리티.
 *
 * <p>코드 값은 기존 {@link ErrorCode} enum 에 집중 관리되며,
 * 이 클래스는 도메인 레이어에서 의미 있는 이름으로 접근하기 위한 상수 매핑만 제공합니다.</p>
 */
public final class DataSourceErrorCode {

    private DataSourceErrorCode() {
    }

    /** 존재하지 않는 DataSource 조회/삭제 시. */
    public static final ErrorCode NOT_FOUND = ErrorCode.DATASOURCE_NOT_FOUND;

    /** 현재 사용자가 소유하지 않은 DataSource 접근 시. */
    public static final ErrorCode FORBIDDEN = ErrorCode.DATASOURCE_FORBIDDEN;

    /** 업로드된 파일이 CSV가 아니거나 비어 있는 경우. */
    public static final ErrorCode INVALID_FILE = ErrorCode.DATASOURCE_INVALID_FILE;

    /** 파일 저장/읽기 실패 등 스토리지 I/O 문제. */
    public static final ErrorCode STORAGE_ERROR = ErrorCode.DATASOURCE_STORAGE_ERROR;
}
