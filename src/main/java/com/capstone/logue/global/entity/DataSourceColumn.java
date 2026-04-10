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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
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
 * 업로드된 데이터 소스의 컬럼별 객관적 메타데이터를 저장하는 엔티티입니다.
 *
 * <p>컬럼명·타입·통계 등 파일에서 파싱한 불변 정보만 담습니다.
 * 시맨틱 역할 분류와 확정 여부는 플로우마다 다를 수 있으므로
 * {@link AnalysisFlowColumn}에 분리 저장됩니다.</p>
 */
@Getter
@Entity
@Table(name = "data_source_columns")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class DataSourceColumn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 이 컬럼이 속한 데이터 소스. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "data_source_id", nullable = false)
    private DataSource dataSource;

    /** 원본 파일의 컬럼명. */
    @Column(name = "column_name", nullable = false, length = 255)
    private String columnName;

    /** 파싱된 컬럼의 데이터 타입 (예: string, integer, date). */
    @Column(name = "data_type", nullable = false, length = 255)
    private String dataType;

    /** NULL 값 비율 (0.0 ~ 1.0). */
    @Column(name = "null_ratio", nullable = false)
    private Double nullRatio;

    /** 고유값 수. */
    @Column(name = "unique_count", nullable = false)
    private Integer uniqueCount;

    /** 대표 샘플 값 목록. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "sample_values", columnDefinition = "jsonb")
    private JsonNode sampleValues;

    /** 이 컬럼을 참조하는 분석 플로우별 시맨틱 역할 매핑 목록. */
    @Builder.Default
    @OneToMany(mappedBy = "dataSourceColumn", fetch = FetchType.LAZY)
    private List<AnalysisFlowColumn> analysisFlowColumns = new ArrayList<>();
}
