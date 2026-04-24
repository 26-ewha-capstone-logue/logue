package com.capstone.logue.anal.repository;

import com.capstone.logue.global.entity.AiTaggingJob;
import com.capstone.logue.global.entity.enums.JobStage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AiTaggingJobRepository extends JpaRepository<AiTaggingJob, Long> {
    Optional<AiTaggingJob> findByConversationIdAndStage(Long conversationId, JobStage stage);

    Optional<AiTaggingJob> findTopByConversationIdAndStageOrderByCreatedAtDesc(Long conversationId, JobStage stage);
}
