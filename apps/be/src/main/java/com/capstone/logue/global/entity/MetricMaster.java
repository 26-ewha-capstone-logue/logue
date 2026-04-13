package com.capstone.logue.global.entity;

import com.capstone.logue.global.entity.base.BaseTimeEntity;
import com.capstone.logue.global.entity.enums.MetricType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 분석에 사용할 지표 정의와 계산식을 관리하는 마스터 엔티티입니다.
 */
@Getter
@Entity
@Table(name = "metric_master")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class MetricMaster extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "metric_type", nullable = false, length = 20)
    private MetricType metricType;

    @Column(name = "formula_numerator", length = 50)
    private String formulaNumerator;

    @Column(name = "formula_denominator", length = 50)
    private String formulaDenominator;

    @Column(name = "aggregation_unit", nullable = false, length = 50)
    private String aggregationUnit;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Builder.Default
    @OneToMany(mappedBy = "metric", fetch = FetchType.LAZY)
    private List<AnalysisCriteria> analysisCriteria = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "metric", fetch = FetchType.LAZY)
    private List<MetricDimensionMapping> metricDimensionMappings = new ArrayList<>();
}
