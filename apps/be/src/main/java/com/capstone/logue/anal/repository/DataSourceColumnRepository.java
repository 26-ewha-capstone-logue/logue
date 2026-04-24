package com.capstone.logue.anal.repository;

import com.capstone.logue.global.entity.DataSourceColumn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DataSourceColumnRepository extends JpaRepository<DataSourceColumn, Long> {

    List<DataSourceColumn> findByDataSourceId(Long dataSourceId);
}
