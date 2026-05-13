package com.capstone.logue.anal.dto.fastapi.request;

/**
 * 사전 정의된 지표 정보입니다.
 *
 * <p>{@code metricType} 이 RATIO 인 경우 분자/분모 컬럼이 사용됩니다.</p>
 */
public record PredefinedMetricInfo(
        String metricName,
        String displayName,
        String metricType,
        String formulaNumerator,
        String formulaDenominator
) {
}
