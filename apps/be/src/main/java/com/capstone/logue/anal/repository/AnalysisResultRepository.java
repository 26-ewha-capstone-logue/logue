package com.capstone.logue.anal.repository;

import com.capstone.logue.global.entity.AnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AnalysisResultRepository extends JpaRepository<AnalysisResult, Long> {

    Optional<AnalysisResult> findByAnalysisCriteriaId(Long analysisCriteriaId);
}
