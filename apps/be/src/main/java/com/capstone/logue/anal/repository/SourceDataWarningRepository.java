package com.capstone.logue.anal.repository;

import com.capstone.logue.global.entity.SourceDataWarning;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SourceDataWarningRepository extends JpaRepository<SourceDataWarning, Long> {

    List<SourceDataWarning> findByDataSourceId(Long dataSourceId);

    /**
     * 주어진 DataSource id 들에 연결된 SourceDataWarning 을 일괄 삭제합니다.
     */
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM SourceDataWarning w WHERE w.dataSource.id IN :dataSourceIds")
    int deleteAllByDataSourceIds(@Param("dataSourceIds") Collection<Long> dataSourceIds);
}
