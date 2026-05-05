package com.capstone.logue.anal.service;

import com.capstone.logue.anal.repository.AiTaggingJobRepository;
import com.capstone.logue.global.entity.AiTaggingJob;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * FAILED 상태의 AI 태깅 작업을 수동으로 재시도하는 서비스입니다.
 *
 * <p>
 * FAILED 상태의 작업을 QUEUED로 초기화한 후
 * {@link FileAnalysisAsyncService}를 통해 분석을 재시작합니다.
 * FAILED 상태가 아닌 작업에 재시도를 요청하면 예외가 발생합니다.
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JobRetryService {
    private final AiTaggingJobRepository aiTaggingJobRepository;
    private final FileAnalysisAsyncService fileAnalysisAsyncService;

    /**
     * FAILED 상태의 작업을 QUEUED로 초기화하고 비동기 분석을 재시작합니다.
     *
     * <p>
     * 트랜잭션 커밋 후 {@link FileAnalysisAsyncService#analyzeFileAsync}가 실행되므로
     * DB에 QUEUED 상태가 저장된 이후 분석이 시작됩니다.
     * </p>
     *
     * @param jobId 재시도할 작업 ID
     * @throws LogueException 작업을 찾을 수 없는 경우 (JOB_NOT_FOUND),
     *                        FAILED 상태가 아닌 경우 (JOB_NOT_RETRYABLE)
     */
    @Transactional
    public void retryJob(Long jobId) {
        AiTaggingJob job = aiTaggingJobRepository.findById(jobId)
                .orElseThrow(() -> new LogueException(ErrorCode.JOB_NOT_FOUND));

        Long dataSourceId = job.getAnalysisFlow().getDataSource().getId();
        job.resetToQueued(); // FAILED가 아니면 내부에서 예외

        log.info("[JobRetryService] 수동 재시도 시작: jobId={}", jobId);
        fileAnalysisAsyncService.analyzeFileAsync(jobId, dataSourceId);
    }
}
