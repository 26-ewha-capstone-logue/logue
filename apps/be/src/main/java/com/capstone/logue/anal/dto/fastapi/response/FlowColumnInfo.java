package com.capstone.logue.anal.dto.fastapi.response;

/**
 * 분석 기준에 사용되는 컬럼과 시맨틱 역할 매핑입니다.
 */
public record FlowColumnInfo(
        String columnName,
        String semanticRole
) {
}
