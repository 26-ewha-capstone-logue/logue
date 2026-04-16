package com.capstone.logue.global.entity;

import com.capstone.logue.global.entity.base.CreatedTimeEntity;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 분석 기준({@link AnalysisCriteria})으로부터 산출된 최종 분석 결과를 저장하는 엔티티입니다.
 *
 * <p>하나의 확정된 분석 기준에 대해 하나의 분석 결과가 생성됩니다.
 * 차트 렌더링에 필요한 데이터는 {@code chartData}에 JSON 형태로 저장되며,
 * 결과 산출 중 감지된 데이터 품질 경고는 {@code dataWarnings}에 함께 기록됩니다.</p>
 *
 * <p>생성 후 수정되지 않는 불변 레코드이므로
 * {@code created_at}만 관리하는 {@link CreatedTimeEntity}를 상속합니다.</p>
 */
@Getter
@Entity
@Table(name = "analysis_results")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class AnalysisResult extends CreatedTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 이 결과를 산출하는 데 사용된 확정 분석 기준. */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "analysis_criteria_id", nullable = false)
    private AnalysisCriteria analysisCriteria;

    /** 분석 결과 설명. 사용자에게 표시되는 요약 문장입니다. */
    @Column(name = "description", nullable = false, length = 255)
    private String description;

    /** 차트 렌더링에 사용되는 시각화 데이터. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "chart_data", nullable = false, columnDefinition = "jsonb")
    private JsonNode chartData;

    /**
     * 분석 결과 산출 중 감지된 데이터 품질 경고 목록.
     * JSON 형태의 스냅샷으로 저장됩니다. null 이면 경고 없음입니다.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data_warnings", columnDefinition = "jsonb")
    private JsonNode dataWarnings;
}
