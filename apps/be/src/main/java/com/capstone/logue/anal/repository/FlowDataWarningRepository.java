package com.capstone.logue.anal.repository;

import com.capstone.logue.global.entity.FlowDataWarning;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FlowDataWarningRepository extends JpaRepository<FlowDataWarning, Long> {

    List<FlowDataWarning> findByAnalysisCriteriaId(Long analysisCriteriaId);
}
