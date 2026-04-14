package com.capstone.logue.global.entity;

import com.capstone.logue.global.entity.base.BaseTimeEntity;
import com.capstone.logue.global.entity.enums.FlowWarningKey;
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
 * 분석 기준({@link AnalysisCriteria}) 수준에서 감지된 플로우 경고를 저장하는 엔티티입니다.
 *
 * <p>질문·데이터 불일치, 핵심 컬럼 null 초과 등 분석 플로우 진행 중 발생한 이슈를
 * 사용자에게 알리기 위해 생성됩니다.
 * 내부 식별 코드({@link FlowWarningKey})와 사용자 노출 문구({@code comment})를 모두 보유하여,
 * 프로그래밍적 처리와 UI 표시를 함께 지원합니다.</p>
 *
 * <p>경고는 {@code priority} 값(100, 200 단위)에 따라 우선순위가 결정되며,
 * 낮은 값이 더 높은 우선순위를 가집니다.</p>
 */
@Getter
@Entity
@Table(name = "flow_data_warnings")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class FlowDataWarning extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 이 경고가 속한 분석 기준. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "analysis_criteria_id", nullable = false)
    private AnalysisCriteria analysisCriteria;

    /** 경고의 내부 식별 코드. 프로그래밍적 처리에 사용됩니다. */
    @Enumerated(EnumType.STRING)
    @Column(name = "code", nullable = false, length = 50)
    private FlowWarningKey code;

    /** 경고명. 간결한 제목 형태입니다. */
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    /** 사용자에게 노출되는 경고 설명 문구. */
    @Column(name = "comment", nullable = false, length = 255)
    private String comment;

    /**
     * 경고 우선순위. 100, 200 단위로 설정하며 값이 낮을수록 우선 표시됩니다.
     * null 이면 우선순위 미지정입니다.
     */
    @Column(name = "priority")
    private Integer priority;
}
