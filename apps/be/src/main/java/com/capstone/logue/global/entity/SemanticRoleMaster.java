package com.capstone.logue.global.entity;

import com.capstone.logue.global.entity.enums.SelectionType;
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
 * 컬럼을 어떤 의미 역할로 분류할지 정의하는 시맨틱 롤 마스터 엔티티입니다.
 */
@Getter
@Entity
@Table(name = "semantic_role_master")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class SemanticRoleMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "selection_type", nullable = false, length = 10)
    private SelectionType selectionType;

    @Column(name = "is_required", nullable = false)
    private boolean required;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Builder.Default
    @OneToMany(mappedBy = "master", fetch = FetchType.LAZY)
    private List<SemanticRoleOption> options = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "semanticRoleMaster", fetch = FetchType.LAZY)
    private List<MetricDimensionMapping> metricDimensionMappings = new ArrayList<>();
}
