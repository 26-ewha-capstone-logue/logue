package com.capstone.logue.global.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 분석 플로우({@link AnalysisFlow})에서 사용자가 확인·확정한 분석 기준을 저장하는 엔티티입니다.
 *
 * <p>하나의 플로우 안에서 기준이 여러 차례 수정될 수 있으므로 복수의 레코드가 존재할 수 있으며,
 * 실제 분석({@link AnalysisResult})에 사용된 기준은 {@code isConfirmed == true} 인 레코드로 식별합니다.</p>
 */
@Getter
@Entity
@Table(name = "analysis_criteria")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class AnalysisCriteria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 이 분석 기준이 속한 분석 플로우. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "analysis_flow_id", nullable = false)
    private AnalysisFlow analysisFlow;

    /** 이 기준에서 사용하는 지표 정의. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "metric_id", nullable = false)
    private MetricMaster metric;

    /** 계산식 분자에 해당하는 컬럼명. */
    @Column(name = "formula_numerator", nullable = false, length = 50)
    private String formulaNumerator;

    /** 계산식 분모에 해당하는 컬럼명. */
    @Column(name = "formula_denominator", nullable = false, length = 50)
    private String formulaDenominator;

    /** 기준 날짜로 사용할 컬럼명. */
    @Column(name = "base_date_column", nullable = false, length = 50)
    private String baseDateColumn;

    /** 비교 기간 설정값. */
    @Column(name = "compare_period", nullable = false, length = 255)
    private String comparePeriod;

    /** 분석에 사용할 비교축(Dimension) 목록. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dimensions", nullable = false, columnDefinition = "jsonb")
    private JsonNode dimensions;

    /** 분석에 사용된 상세 지표 목록. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "detail_metrics", nullable = false, columnDefinition = "jsonb")
    private JsonNode detailMetrics;

    /** 집계에서 제외할 조건 목록. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "exclude_conditions", nullable = false, columnDefinition = "jsonb")
    private JsonNode excludeConditions;

    /** 사용자가 이 기준을 최종 확정했는지 여부. */
    @Column(name = "is_confirmed", nullable = false)
    private boolean confirmed;

    /** 사용자가 이 기준을 확정한 시각. */
    @Column(name = "confirmed_at")
    private OffsetDateTime confirmedAt;
}
