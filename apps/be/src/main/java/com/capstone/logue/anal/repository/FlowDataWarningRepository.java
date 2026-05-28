package com.capstone.logue.anal.repository;

import com.capstone.logue.global.entity.FlowDataWarning;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FlowDataWarningRepository extends JpaRepository<FlowDataWarning, Long> {

    List<FlowDataWarning> findByAnalysisCriteriaId(Long analysisCriteriaId);

    /**
     * 주어진 AnalysisCriteria id 들에 연결된 FlowDataWarning 을 일괄 삭제합니다.
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM FlowDataWarning w WHERE w.analysisCriteria.id IN :analysisCriteriaIds")
    int deleteAllByAnalysisCriteriaIds(@Param("analysisCriteriaIds") Collection<Long> analysisCriteriaIds);
}
