package com.capstone.logue.global.entity.enums;

/**
 * AI 태깅 작업({@link com.capstone.logue.global.entity.AiTaggingJob})의 실행 상태를 나타내는 값입니다.
 *
 * <p>상태 전이 순서: {@code QUEUED → RUNNING → SUCCESS / FAILED / CANCELED}</p>
 * <p>5xx·네트워크 에러 발생 시: {@code RUNNING → RETRYING → (재시도) → SUCCESS / FAILED}</p>
 *
 * <ul>
 *   <li>{@link #QUEUED} - 실행 대기 중: 작업이 큐에 등록되어 처리를 기다리는 상태입니다.</li>
 *   <li>{@link #RUNNING} - 실행 중: AI 파이프라인이 현재 처리하고 있는 상태입니다.</li>
 *   <li>{@link #RETRYING} - 재시도 중: 5xx 또는 네트워크 에러로 인해 재시도를 대기하고 있는 상태입니다. 최대 3회까지 재시도됩니다.</li>
 *   <li>{@link #SUCCESS} - 성공: 작업이 정상적으로 완료된 최종 상태입니다.</li>
 *   <li>{@link #FAILED} - 실패: 처리 중 오류가 발생하여 중단된 최종 상태입니다.</li>
 *   <li>{@link #CANCELED} - 취소: 외부 요청 또는 정책에 의해 취소된 최종 상태입니다.</li>
 * </ul>
 */
public enum JobStatus {
    QUEUED,
    RUNNING,
    RETRYING,
    SUCCESS,
    FAILED,
    CANCELED
}
