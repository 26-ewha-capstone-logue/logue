package com.capstone.logue.anal.repository;

import com.capstone.logue.global.entity.AnalysisFlowColumn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnalysisFlowColumnRepository extends JpaRepository<AnalysisFlowColumn, Long> {

    List<AnalysisFlowColumn> findByAnalysisFlowId(Long analysisFlowId);
}
