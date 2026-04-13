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
 * 사용자가 업로드한 데이터 소스 파일과 스키마 메타데이터를 저장하는 엔티티입니다.
 *
 * <p>하나의 데이터 소스는 여러 {@link AnalysisFlow}에서 참조될 수 있으며,
 * 컬럼 단위 메타데이터는 {@link DataSourceColumn}에 분리 저장됩니다.</p>
 */
@Getter
@Entity
@Table(name = "data_sources")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class DataSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 이 데이터 소스를 업로드한 사용자. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** 원본 업로드 파일명. */
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    /** 파일 크기 (bytes). */
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /** 오브젝트 스토리지 내 파일 경로 키. */
    @Column(name = "storage_key", columnDefinition = "TEXT")
    private String storageKey;

    /** 파일에서 추출한 전체 스키마 정보 (컬럼명·타입 등). */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "schema_json", nullable = false, columnDefinition = "jsonb")
    private JsonNode schemaJson;

    /** 날짜 컬럼의 범위·연속성 등 날짜 품질 상태 정보. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "date_status", columnDefinition = "jsonb")
    private JsonNode dateStatus;

    /** 데이터 행 수. */
    @Column(name = "row_count", nullable = false)
    private Integer rowCount;

    /** 데이터 컬럼 수. */
    @Column(name = "column_count", nullable = false)
    private Integer columnCount;

    /** 컬럼별 메타데이터 및 시맨틱 분류 결과 목록. */
    @Builder.Default
    @OneToMany(mappedBy = "dataSource", fetch = FetchType.LAZY)
    private List<DataSourceColumn> dataSourceColumns = new ArrayList<>();

    /** 이 데이터 소스를 사용하는 분석 플로우 목록. */
    @Builder.Default
    @OneToMany(mappedBy = "dataSource", fetch = FetchType.LAZY)
    private List<AnalysisFlow> analysisFlows = new ArrayList<>();
}
