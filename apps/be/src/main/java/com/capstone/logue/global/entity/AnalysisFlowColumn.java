package com.capstone.logue.global.entity;

import com.capstone.logue.global.entity.base.BaseTimeEntity;
import com.capstone.logue.global.entity.enums.SemanticRoleType;
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
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 특정 분석 플로우({@link AnalysisFlow})에서 데이터 소스의 컬럼({@link DataSourceColumn})에
 * 부여한 시맨틱 역할을 저장하는 매핑 엔티티입니다.
 *
 * <p>같은 {@link DataSourceColumn}이라도 플로우마다 다른 시맨틱 역할({@link SemanticRoleType})로
 * 분류될 수 있으므로, 컬럼의 객관적 메타데이터({@link DataSourceColumn})와
 * 플로우별 주관적 분류 결과를 분리합니다.</p>
 */
@Getter
@Entity
@Table(name = "analysis_flow_columns")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class AnalysisFlowColumn extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 이 매핑이 속한 분석 플로우. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "analysis_flow_id", nullable = false)
    private AnalysisFlow analysisFlow;

    /** 이 플로우에서 참조하는 데이터 소스 컬럼. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "data_source_column_id", nullable = false)
    private DataSourceColumn dataSourceColumn;

    /** 이 플로우에서 해당 컬럼에 부여한 시맨틱 역할. */
    @Enumerated(EnumType.STRING)
    @Column(name = "semantic_role", nullable = false, length = 30)
    private SemanticRoleType semanticRole;
}
