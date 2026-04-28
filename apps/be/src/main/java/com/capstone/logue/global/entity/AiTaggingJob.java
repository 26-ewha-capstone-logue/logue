package com.capstone.logue.global.entity;

import com.capstone.logue.global.entity.base.BaseTimeEntity;
import com.capstone.logue.global.entity.enums.JobStage;
import com.capstone.logue.global.entity.enums.JobStatus;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import com.fasterxml.jackson.databind.JsonNode;
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
import java.time.OffsetDateTime;

import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * AI 분석 파이프라인의 각 단계에서 실행되는 비동기 작업을 추적하는 엔티티입니다.
 *
 * <p>하나의 사용자 메시지를 처리하기 위해 복수의 단계({@link JobStage})가 순서대로 실행되며,
 * 각 단계마다 별도의 작업 레코드가 생성됩니다.</p>
 *
 * <p>상태는 {@code QUEUED → RUNNING → SUCCESS / FAILED / CANCELED} 순서로 전이되며,
 * 클라이언트는 폴링 API를 통해 진행 상황을 확인합니다.
 * 작업 요청 당시의 입력값 스냅샷은 {@code requestPayload}에 보존되어 디버깅과 재실행에 활용됩니다.</p>
 */
@Getter
@Entity
@Table(name = "ai_tagging_jobs")
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class AiTaggingJob extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 이 작업이 실행된 대화. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    /**
     * 이 작업을 트리거한 사용자 메시지.
     * 어떤 사용자 발화로부터 작업이 생성되었는지 추적합니다.
     * 파일 분석 단계에서의 사용을 위해 {@code nullable=true}로 설정.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "message_id", nullable = true)
    private Message message;

    /** 이 작업이 처리하는 파이프라인 단계. */
    @Enumerated(EnumType.STRING)
    @Column(name = "stage", nullable = false, length = 30)
    private JobStage stage;

    /**
     * 작업 실행 상태.
     * {@code QUEUED → RUNNING → SUCCESS / FAILED / CANCELED} 순서로 전이됩니다.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private JobStatus status;

    /**
     * 작업 실패 시 기록되는 에러 메시지.
     * {@link JobStatus#FAILED} 상태일 때만 값이 존재합니다.
     */
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    /**
     * 작업 요청 당시의 입력값 스냅샷.
     * 디버깅 및 재실행 시 당시 컨텍스트를 복원하기 위해 사용됩니다.
     */
    @Setter
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "request_payload", columnDefinition = "jsonb")
    private JsonNode requestPayload;

    /** 작업 실행 시작 시각. */
    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    /**
     * 작업 종료 시각.
     * 성공·실패·취소 모든 최종 상태에서 기록됩니다.
     * 아직 완료되지 않은 경우 null 입니다.
     */
    @Column(name = "finished_at")
    private OffsetDateTime finishedAt;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "analysis_flow_id", nullable = false)
    private AnalysisFlow analysisFlow;


    @Column(nullable = false)
    private int retryCount = 0;

    /**
     * 작업 상태를 RUNNING으로 변경합니다.
     *
     * <p>
     * 비동기 작업이 실제 실행되기 시작할 때 호출되며,
     * 실행 시작 시각(startedAt)을 현재 시각으로 갱신합니다.
     * </p>
     */
    public void markRunning() {
        this.status = JobStatus.RUNNING;
        this.startedAt = OffsetDateTime.now();
    }

    public void markRetrying(String errorMessage) {
        this.status = JobStatus.RETRYING;
        this.retryCount++;
        this.errorMessage = errorMessage;
    }

    /**
     * 작업 상태를 SUCCESS로 변경합니다.
     *
     * <p>
     * FastAPI 호출 및 결과 저장이 정상적으로 완료된 경우 호출되며,
     * 종료 시각(finishedAt)을 기록합니다.
     * </p>
     */
    public void markSuccess() {
        this.status = JobStatus.SUCCESS;
        this.finishedAt = OffsetDateTime.now();
    }

    /**
     * 작업 상태를 FAILED로 변경합니다.
     *
     * <p>
     * 비동기 작업 수행 중 예외가 발생한 경우 호출되며,
     * 에러 메시지와 함께 종료 시각을 기록합니다.
     * </p>
     *
     * @param errorMessage 실패 원인 메시지
     */
    public void markFailed(String errorMessage) {
        this.status = JobStatus.FAILED;
        this.errorMessage = errorMessage;
        this.finishedAt = OffsetDateTime.now();
    }

    /**
     * 작업 상태를 CANCELED로 변경합니다.
     *
     * <p>
     * 사용자가 진행 중인 작업을 취소한 경우 호출되며,
     * 종료 시각을 기록합니다.
     * </p>
     */
    public void markCanceled() {
        this.status = JobStatus.CANCELED;
        this.finishedAt = OffsetDateTime.now();
    }

    /**
     * 작업 상태를 QUEUED로 초기화합니다.
     *
     * <p>
     * 수동 재시도 API를 통해 FAILED 상태의 작업을 재시도할 때 호출됩니다.
     * FAILED 상태가 아닌 경우 예외가 발생하며, 재시도 횟수와 에러 메시지를 초기화합니다.
     * </p>
     *
     * @throws LogueException FAILED 상태가 아닌 경우 (JOB_NOT_RETRYABLE)
     */
    public void resetToQueued() {
        if (this.status != JobStatus.FAILED) {
            throw new LogueException(ErrorCode.JOB_NOT_RETRYABLE);
        }
        this.status = JobStatus.QUEUED;
        this.retryCount = 0;
        this.errorMessage = null;
    }
}
