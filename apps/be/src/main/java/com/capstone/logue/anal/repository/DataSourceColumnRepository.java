package com.capstone.logue.anal.repository;

import com.capstone.logue.global.entity.DataSourceColumn;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DataSourceColumnRepository extends JpaRepository<DataSourceColumn, Long> {

    List<DataSourceColumn> findByDataSourceId(Long dataSourceId);

    /**
     * 주어진 DataSource id 들에 연결된 DataSourceColumn 을 일괄 삭제합니다.
     * 호출 전에 AnalysisFlowColumn 의 data_source_column 참조가 먼저 정리되어야 합니다.
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM DataSourceColumn c WHERE c.dataSource.id IN :dataSourceIds")
    int deleteAllByDataSourceIds(@Param("dataSourceIds") Collection<Long> dataSourceIds);
}
