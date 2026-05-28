package com.capstone.logue.anal.repository;

import com.capstone.logue.global.entity.AnalysisFlow;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AnalysisFlowRepository extends JpaRepository<AnalysisFlow, Long> {

    /**
     * 주어진 DataSource id 들에 연결된 AnalysisFlow 의 id 목록을 조회합니다.
     * 하위 엔티티(메시지·분석기준·태깅잡 등) cascade 삭제 전 식별자 확보용입니다.
     */
    @Query("SELECT af.id FROM AnalysisFlow af WHERE af.dataSource.id IN :dataSourceIds")
    List<Long> findIdsByDataSourceIds(@Param("dataSourceIds") Collection<Long> dataSourceIds);

    /**
     * 주어진 DataSource id 들에 연결된 AnalysisFlow 를 일괄 삭제합니다.
     * 호출 전에 모든 하위 엔티티가 먼저 삭제되어야 FK 위반 없이 동작합니다.
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM AnalysisFlow af WHERE af.dataSource.id IN :dataSourceIds")
    int deleteAllByDataSourceIds(@Param("dataSourceIds") Collection<Long> dataSourceIds);
}
