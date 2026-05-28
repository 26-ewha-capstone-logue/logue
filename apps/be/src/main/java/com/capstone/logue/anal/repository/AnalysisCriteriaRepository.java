package com.capstone.logue.anal.repository;

import com.capstone.logue.global.entity.AnalysisCriteria;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AnalysisCriteriaRepository extends JpaRepository<AnalysisCriteria, Long> {

    Optional<AnalysisCriteria> findTopByAnalysisFlowIdOrderByCreatedAtDescIdDesc(Long analysisFlowId);

    List<AnalysisCriteria> findByAnalysisFlowIdOrderByCreatedAtDesc(Long analysisFlowId);

    /**
     * 주어진 AnalysisFlow id 들에 연결된 AnalysisCriteria 의 id 목록을 조회합니다.
     * AnalysisResult·FlowDataWarning cascade 삭제 전 식별자 확보용입니다.
     */
    @Query("SELECT c.id FROM AnalysisCriteria c WHERE c.analysisFlow.id IN :analysisFlowIds")
    List<Long> findIdsByAnalysisFlowIds(@Param("analysisFlowIds") Collection<Long> analysisFlowIds);

    /**
     * 주어진 AnalysisFlow id 들에 연결된 AnalysisCriteria 를 일괄 삭제합니다.
     * 호출 전에 AnalysisResult·FlowDataWarning 이 먼저 삭제되어야 합니다.
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM AnalysisCriteria c WHERE c.analysisFlow.id IN :analysisFlowIds")
    int deleteAllByAnalysisFlowIds(@Param("analysisFlowIds") Collection<Long> analysisFlowIds);
}
