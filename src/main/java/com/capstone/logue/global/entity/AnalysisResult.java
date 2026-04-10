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
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 분석 플로우({@link AnalysisFlow})의 최종 분석 결과를 저장하는 엔티티입니다.
 *
 * <p>어떤 기준({@link AnalysisCriteria})으로 산출되었는지 명시적으로 연결되며,
 * MVP 기준 플로우당 하나이고 이후 확장 가능합니다.</p>
 */
@Getter
@Entity
@Table(name = "analysis_results")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class AnalysisResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 이 결과가 속한 분석 플로우. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "analysis_flow_id", nullable = false)
    private AnalysisFlow analysisFlow;

    /** 이 결과를 산출하는 데 사용된 확정 분석 기준. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "analysis_criteria_id", nullable = false)
    private AnalysisCriteria analysisCriteria;

    /** 분석에 사용된 지표 코드. */
    @Column(name = "metric", nullable = false, length = 30)
    private String metric;

    /** 실제 적용된 계산식 문자열. */
    @Column(name = "formula", nullable = false, length = 255)
    private String formula;

    /** 분석 기준 날짜 또는 기간 식별자. */
    @Column(name = "base_date", nullable = false, length = 50)
    private String baseDate;

    /** 분석에 사용된 비교축(Dimension) 목록. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dimensions", nullable = false, columnDefinition = "jsonb")
    private JsonNode dimensions;

    /** 분석에 사용된 상세 지표 목록. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "detail_metrics", nullable = false, columnDefinition = "jsonb")
    private JsonNode detailMetrics;

    /** 비교 기간 설정값. */
    @Column(name = "compare_period", nullable = false, length = 255)
    private String comparePeriod;

    /** 집계에서 제외된 조건 목록. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "exclude_conditions", nullable = false, columnDefinition = "jsonb")
    private JsonNode excludeConditions;

    /** 차트 렌더링에 사용되는 시각화 데이터. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "chart_data", columnDefinition = "jsonb")
    private JsonNode chartData;

    /** 분석 과정에서 감지된 데이터 품질 경고 목록. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data_warnings", columnDefinition = "jsonb")
    private JsonNode dataWarnings;
}
