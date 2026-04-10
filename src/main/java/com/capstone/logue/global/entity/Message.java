package com.capstone.logue.global.entity;

import com.capstone.logue.global.entity.base.CreatedTimeEntity;
import com.capstone.logue.global.entity.enums.MessageRole;
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
 * 분석 플로우({@link AnalysisFlow}) 안에서 오간 개별 메시지를 저장하는 엔티티입니다.
 *
 * <p>사용자의 질문과 AI의 응답이 번갈아 쌓이며,
 * 모든 메시지는 하나의 {@link AnalysisFlow}에 귀속됩니다.</p>
 */
@Getter
@Entity
@Table(name = "messages")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Message extends CreatedTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 이 메시지가 속한 분석 플로우. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "analysis_flow_id", nullable = false)
    private AnalysisFlow analysisFlow;

    /** 메시지 발신자 역할 (사용자 또는 AI). */
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private MessageRole role;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;
}
