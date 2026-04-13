package com.capstone.logue.global.entity;

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

/**
 * 시맨틱 롤 마스터 아래의 실제 선택 옵션과 연결된 경고 정보를 저장하는 엔티티입니다.
 *
 * <p>각 옵션이 실제로 어떤 컬럼에 적용됐는지는 {@link AnalysisFlowColumn}을 통해 확인합니다.</p>
 */
@Getter
@Entity
@Table(name = "semantic_role_option")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class SemanticRoleOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 이 옵션이 속한 시맨틱 롤 마스터. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "master_id", nullable = false)
    private SemanticRoleMaster master;

    /** 이 옵션 선택 시 함께 표시될 데이터 경고 정보. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warning_id", nullable = false)
    private DataWarning warning;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    /** 이 옵션이 적용된 분석 플로우별 컬럼 매핑 목록. */
    @Builder.Default
    @OneToMany(mappedBy = "semanticRoleOption", fetch = FetchType.LAZY)
    private List<AnalysisFlowColumn> analysisFlowColumns = new ArrayList<>();
}
