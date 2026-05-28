package com.capstone.logue.anal.repository;

import com.capstone.logue.global.entity.AiTaggingJob;
import com.capstone.logue.global.entity.enums.JobStage;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AiTaggingJobRepository extends JpaRepository<AiTaggingJob, Long> {
    Optional<AiTaggingJob> findByConversationIdAndStage(Long conversationId, JobStage stage);

    Optional<AiTaggingJob> findTopByConversationIdAndStageOrderByCreatedAtDesc(Long conversationId, JobStage stage);

    Optional<AiTaggingJob> findTopByAnalysisFlowIdAndStageOrderByCreatedAtDescIdDesc(Long analysisFlowId, JobStage stage);

    Optional<AiTaggingJob> findTopByMessageIdAndStageOrderByCreatedAtDescIdDesc(Long messageId, JobStage stage);

    /**
     * 주어진 AnalysisFlow id 들에 연결된 AiTaggingJob 을 일괄 삭제합니다.
     * V4 이전에 analysis_flow_id 가 NULL 인 레거시 로우는 message 경로(message.analysisFlow)
     * 로 매칭되어 함께 정리됩니다.
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM AiTaggingJob j "
            + "WHERE j.analysisFlow.id IN :analysisFlowIds "
            + "OR j.message.analysisFlow.id IN :analysisFlowIds")
    int deleteAllByAnalysisFlowIds(@Param("analysisFlowIds") Collection<Long> analysisFlowIds);
}
