package com.capstone.logue.anal.service;

import com.capstone.logue.anal.repository.AiTaggingJobRepository;
import com.capstone.logue.global.entity.AiTaggingJob;
import com.capstone.logue.global.exception.ErrorCode;
import com.capstone.logue.global.exception.LogueException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobRetryService {
    private final AiTaggingJobRepository aiTaggingJobRepository;
    private final FileAnalysisAsyncService fileAnalysisAsyncService;

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
