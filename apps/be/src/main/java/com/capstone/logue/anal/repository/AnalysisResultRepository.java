package com.capstone.logue.anal.repository;

import com.capstone.logue.global.entity.AnalysisResult;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AnalysisResultRepository extends JpaRepository<AnalysisResult, Long> {

    Optional<AnalysisResult> findByAnalysisCriteriaId(Long analysisCriteriaId);

    /**
     * 주어진 AnalysisCriteria id 들에 연결된 AnalysisResult 를 일괄 삭제합니다.
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM AnalysisResult r WHERE r.analysisCriteria.id IN :analysisCriteriaIds")
    int deleteAllByAnalysisCriteriaIds(@Param("analysisCriteriaIds") Collection<Long> analysisCriteriaIds);
}
