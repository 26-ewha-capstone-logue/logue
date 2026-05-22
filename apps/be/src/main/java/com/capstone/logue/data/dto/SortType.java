package com.capstone.logue.data.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * DataSource 목록 조회 정렬 기준.
 *
 * <ul>
 *   <li>{@link #LATEST} - 최근 업로드 순 (기본값)</li>
 *   <li>{@link #MOST_USED} - 사용량 많은 순</li>
 * </ul>
 *
 * <p>쿼리 파라미터 {@code sort}가 누락되거나 {@code null}인 경우 {@link #fromNullable(SortType)}
 * 를 통해 {@link #LATEST}로 보정됩니다.</p>
 */
@Schema(description = "DataSource 목록 정렬 기준")
public enum SortType {

    /** 최근 업로드 순. */
    LATEST,

    /** 사용량 많은 순. */
    MOST_USED;

    /**
     * 파라미터 미입력 시 {@link #LATEST}를 기본값으로 반환합니다.
     *
     * @param value 요청에서 전달된 정렬 기준 (nullable)
     * @return 전달 값이 {@code null}이면 {@link #LATEST}, 아니면 그대로
     */
    public static SortType fromNullable(SortType value) {
        return value == null ? LATEST : value;
    }
}
