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
 *
 * <p>업로드 직후 생성만 되고 이후 수정되지 않는 불변 레코드이므로
 * {@code created_at}만 관리하는 {@link CreatedTimeEntity}를 상속합니다.</p>
 */
@Getter
@Entity
@Table(name = "data_sources")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class DataSource extends CreatedTimeEntity {

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

    /**
     * 데이터 상태 요약 정보.
     * 날짜 컬럼 범위·연속성 등 업로드 시 분석된 데이터 품질 개요를 담습니다.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data_status", columnDefinition = "jsonb")
    private JsonNode dataStatus;

    /** 데이터 행 수. */
    @Column(name = "row_count", nullable = false)
    private Integer rowCount;

    /** 데이터 컬럼 수. */
    @Column(name = "column_count", nullable = false)
    private Integer columnCount;

    /** 컬럼별 메타데이터 목록. */
    @Builder.Default
    @OneToMany(mappedBy = "dataSource", fetch = FetchType.LAZY)
    private List<DataSourceColumn> dataSourceColumns = new ArrayList<>();

    /** 이 데이터 소스를 사용하는 분석 플로우 목록. */
    @Builder.Default
    @OneToMany(mappedBy = "dataSource", fetch = FetchType.LAZY)
    private List<AnalysisFlow> analysisFlows = new ArrayList<>();

    /** 이 데이터 소스에서 감지된 경고 목록. */
    @Builder.Default
    @OneToMany(mappedBy = "dataSource", fetch = FetchType.LAZY)
    private List<SourceDataWarning> sourceDataWarnings = new ArrayList<>();
}
