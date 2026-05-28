package com.capstone.logue.anal.repository;

import com.capstone.logue.global.entity.Message;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByAnalysisFlowIdOrderByCreatedAtAscIdAsc(Long analysisFlowId);

    /**
     * 주어진 AnalysisFlow id 들에 연결된 Message 를 일괄 삭제합니다.
     * 호출 전에 AiTaggingJob 의 message 참조가 먼저 정리되어야 합니다.
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM Message m WHERE m.analysisFlow.id IN :analysisFlowIds")
    int deleteAllByAnalysisFlowIds(@Param("analysisFlowIds") Collection<Long> analysisFlowIds);
}
