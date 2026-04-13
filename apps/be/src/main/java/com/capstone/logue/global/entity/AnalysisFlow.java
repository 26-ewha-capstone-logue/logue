package com.capstone.logue.global.entity;

import com.capstone.logue.global.entity.base.BaseTimeEntity;
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
 * 하나의 대화({@link Conversation}) 안에서 수행되는 단일 분석 플로우를 표현하는 엔티티입니다.
 *
 * <p>분석 플로우는 사용자의 질문부터 분석 기준 확정, 최종 분석 결과 생성까지의
 * 한 사이클을 나타냅니다. 하나의 대화에 여러 플로우가 존재할 수 있으며,
 * 각 플로우는 반드시 하나의 {@link DataSource}에 종속됩니다.</p>
 *
 * <p>플로우 내부에서는 여러 차례 메시지를 주고받을 수 있고({@link Message}),
 * 분석 기준({@link AnalysisCriteria})이 여러 번 수정될 수 있습니다.
 * 실제 분석에 사용된 기준은 {@link AnalysisCriteria#isConfirmed()} 로 구분합니다.</p>
 */
@Getter
@Entity
@Table(name = "analysis_flows")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class AnalysisFlow extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 이 플로우가 속한 대화 세션. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    /**
     * 이 플로우에서 분석 대상으로 사용하는 데이터 소스.
     * 플로우당 반드시 하나로 고정됩니다.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "data_source_id", nullable = false)
    private DataSource dataSource;

    /** 이 플로우 안에서 오간 메시지 목록 (사용자 질문 및 AI 응답). */
    @Builder.Default
    @OneToMany(mappedBy = "analysisFlow", fetch = FetchType.LAZY)
    private List<Message> messages = new ArrayList<>();

    /**
     * 이 플로우에서 생성·수정된 분석 기준 이력.
     * MVP 기준 하나이며, 이후 반복 수정 시 복수 레코드가 쌓입니다.
     */
    @Builder.Default
    @OneToMany(mappedBy = "analysisFlow", fetch = FetchType.LAZY)
    private List<AnalysisCriteria> analysisCriteria = new ArrayList<>();

    /**
     * 이 플로우에서 생성된 분석 결과 목록.
     * MVP 기준 하나이며, 이후 확장 가능합니다.
     */
    @Builder.Default
    @OneToMany(mappedBy = "analysisFlow", fetch = FetchType.LAZY)
    private List<AnalysisResult> analysisResults = new ArrayList<>();

    /** 이 플로우에서 사용하는 데이터 소스 컬럼별 시맨틱 역할 매핑 목록. */
    @Builder.Default
    @OneToMany(mappedBy = "analysisFlow", fetch = FetchType.LAZY)
    private List<AnalysisFlowColumn> analysisFlowColumns = new ArrayList<>();
}
