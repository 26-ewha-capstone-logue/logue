package com.capstone.logue.global.entity;

import com.capstone.logue.global.entity.base.BaseTimeEntity;
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
 * 사용자와 Logue 간의 대화 세션을 표현하는 엔티티입니다.
 *
 * <p>하나의 대화는 여러 {@link AnalysisFlow}를 포함할 수 있으며,
 * 각 플로우에서 독립적인 질문과 분석이 수행됩니다.
 * 데이터 소스는 대화 단위가 아닌 각 {@link AnalysisFlow} 단위로 지정됩니다.</p>
 */
@Getter
@Entity
@Table(name = "conversations")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Conversation extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 이 대화를 소유한 사용자. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    /** 이 대화에 속한 분석 플로우 목록. MVP 기준 하나이며, 이후 확장 가능합니다. */
    @Builder.Default
    @OneToMany(mappedBy = "conversation", fetch = FetchType.LAZY)
    private List<AnalysisFlow> analysisFlows = new ArrayList<>();
}
