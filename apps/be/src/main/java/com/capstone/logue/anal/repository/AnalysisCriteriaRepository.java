package com.capstone.logue.anal.repository;

import com.capstone.logue.global.entity.AnalysisCriteria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnalysisCriteriaRepository extends JpaRepository<AnalysisCriteria, Long> {

    Optional<AnalysisCriteria> findTopByAnalysisFlowIdOrderByCreatedAtDescIdDesc(Long analysisFlowId);

    List<AnalysisCriteria> findByAnalysisFlowIdOrderByCreatedAtDesc(Long analysisFlowId);
}
