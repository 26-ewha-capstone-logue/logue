package com.capstone.logue.global.entity;

import com.capstone.logue.global.entity.base.BaseTimeEntity;
import com.capstone.logue.global.entity.enums.AnalysisType;
import com.capstone.logue.global.entity.enums.MetricType;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
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
 *
 * <p>분석 방식은 {@link AnalysisType}(비교/순위)으로 구분되며, 지표 계산 방식은
 * {@link MetricType}(RATIO/COUNT/SUM)으로 구분됩니다.
 * RATIO 타입인 경우 {@code formulaNumerator}와 {@code formulaDenominator}가 사용됩니다.</p>
 */
@Getter
@Entity
@Table(name = "analysis_criteria")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class AnalysisCriteria extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 이 분석 기준이 속한 분석 플로우. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "analysis_flow_id", nullable = false)
    private AnalysisFlow analysisFlow;

    /** 분석 방식(질문 유형). 비교 분석 또는 순위 분석입니다. */
    @Enumerated(EnumType.STRING)
    @Column(name = "analysis_type", nullable = false, length = 20)
    private AnalysisType analysisType;

    /** 분석에 사용하는 지표명 (예: 매출, 전환율). */
    @Column(name = "metric_name", nullable = false, length = 255)
    private String metricName;

    /** 지표 계산 방식. RATIO / COUNT / SUM 중 하나입니다. */
    @Enumerated(EnumType.STRING)
    @Column(name = "metric_type", nullable = false, length = 20)
    private MetricType metricType;

    /**
     * RATIO 타입 계산식의 분자에 해당하는 컬럼명.
     * {@link MetricType#RATIO} 타입일 때만 사용됩니다.
     */
    @Column(name = "formula_numerator", length = 255)
    private String formulaNumerator;

    /**
     * RATIO 타입 계산식의 분모에 해당하는 컬럼명.
     * {@link MetricType#RATIO} 타입일 때만 사용됩니다.
     */
    @Column(name = "formula_denominator", length = 255)
    private String formulaDenominator;

    /** 분석 기간을 결정하는 날짜 기준 컬럼명. */
    @Column(name = "base_date_column", nullable = false, length = 255)
    private String baseDateColumn;

    /**
     * 분석 기간(표준 기간).
     * {@code baseDateColumn}을 어느 시간 범위에서 분석할지를 나타냅니다 (예: "2024-01", "2024-Q1").
     */
    @Column(name = "standard_period", nullable = false, length = 255)
    private String standardPeriod;

    /**
     * 비교 기간.
     * {@code standardPeriod}와 비교할 기간입니다 (예: "2023-01").
     * {@link AnalysisType#COMPARISON} 타입일 때 사용됩니다.
     */
    @Column(name = "compare_period", length = 255)
    private String comparePeriod;

    /**
     * 정렬 기준 컬럼명 또는 지표명.
     * 결과 행을 어떤 기준으로 정렬할지 결정합니다.
     */
    @Column(name = "sort_by", nullable = false, length = 255)
    private String sortBy;

    /**
     * 정렬 방향. {@code asc}(오름차순) 또는 {@code desc}(내림차순) 값을 가집니다.
     */
    @Column(name = "sort_direction", nullable = false, length = 10)
    private String sortDirection;

    /**
     * 비교 기준(그룹 축) 목록.
     * 결과를 어떤 축으로 나눌지를 JSON 배열로 저장합니다 (예: ["카테고리", "지역"]).
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "group_by", nullable = false, columnDefinition = "jsonb")
    private JsonNode groupBy;

    /**
     * 결과 개수 제한.
     * 상위 N개까지만 결과를 보여줄 때 사용합니다. null 이면 제한 없음입니다.
     */
    @Column(name = "limit_num")
    private Long limitNum;

    /**
     * 적용 조건(포함/제외 필터) 목록.
     * 특정 값을 포함하거나 제외하는 조건을 JSON 형태로 저장합니다.
     * null 이면 조건 없음입니다.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "filters", columnDefinition = "jsonb")
    private JsonNode filters;

    /**
     * 분석 기준 도출 과정에서 감지된 데이터 경고 목록.
     * JSON 형태의 스냅샷으로 저장됩니다. null 이면 경고 없음입니다.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data_warnings", columnDefinition = "jsonb")
    private JsonNode dataWarnings;

    /**
     * 사용자가 이 기준을 최종 확정했는지 여부.
     * {@code true} 인 레코드만 실제 분석({@link AnalysisResult})에 사용됩니다.
     */
    @Column(name = "is_confirmed")
    private Boolean isConfirmed;

    /** 사용자가 이 기준을 확정한 시각. 확정 전은 null 입니다. */
    @Column(name = "confirmed_at")
    private OffsetDateTime confirmedAt;

    /** 이 분석 기준으로 산출된 분석 결과. 확정 후 생성됩니다. */
    @OneToOne(mappedBy = "analysisCriteria", fetch = FetchType.LAZY)
    private AnalysisResult analysisResult;

    /** 이 분석 기준에서 감지된 플로우 경고 목록. */
    @Builder.Default
    @OneToMany(mappedBy = "analysisCriteria", fetch = FetchType.LAZY)
    private List<FlowDataWarning> flowDataWarnings = new ArrayList<>();

    /**
     * 사용자 수정 요청을 반영합니다.
     *
     * <p>baseDateColumn, standardPeriod, comparePeriod, sortBy, sortDirection, limitNum 은 항상 갱신되며,
     * groupBy / filters 는 null 이 아닌 경우에만 갱신됩니다.</p>
     */
    public void applyUserUpdate(
            String baseDateColumn,
            String standardPeriod,
            String comparePeriod,
            String sortBy,
            String sortDirection,
            Long limitNum,
            JsonNode groupBy,
            JsonNode filters
    ) {
        this.baseDateColumn = baseDateColumn;
        this.standardPeriod = standardPeriod;
        this.comparePeriod = comparePeriod;
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
        this.limitNum = limitNum;
        if (groupBy != null) {
            this.groupBy = groupBy;
        }
        if (filters != null) {
            this.filters = filters;
        }
    }

    /**
     * 분석 기준을 확정 상태로 전환합니다.
     */
    public void confirm() {
        this.isConfirmed = Boolean.TRUE;
        this.confirmedAt = OffsetDateTime.now();
    }
}
