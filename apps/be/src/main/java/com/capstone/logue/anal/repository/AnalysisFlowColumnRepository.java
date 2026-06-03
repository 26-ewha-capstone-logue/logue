package com.capstone.logue.anal.repository;

import com.capstone.logue.global.entity.AnalysisFlowColumn;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AnalysisFlowColumnRepository extends JpaRepository<AnalysisFlowColumn, Long> {

    // getSummary 의 컬럼별 dataSourceColumn LAZY 로딩 N+1 을 fetch join 으로 제거한다.
    @EntityGraph(attributePaths = "dataSourceColumn")
    List<AnalysisFlowColumn> findByAnalysisFlowIdOrderByIdAsc(Long analysisFlowId);

    /**
     * 주어진 AnalysisFlow id 들에 연결된 AnalysisFlowColumn 을 일괄 삭제합니다.
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM AnalysisFlowColumn afc WHERE afc.analysisFlow.id IN :analysisFlowIds")
    int deleteAllByAnalysisFlowIds(@Param("analysisFlowIds") Collection<Long> analysisFlowIds);
}
