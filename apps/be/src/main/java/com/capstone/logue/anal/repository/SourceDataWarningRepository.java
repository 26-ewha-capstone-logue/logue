package com.capstone.logue.anal.repository;

import com.capstone.logue.global.entity.SourceDataWarning;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SourceDataWarningRepository extends JpaRepository<SourceDataWarning, Long> {

    List<SourceDataWarning> findByDataSourceId(Long dataSourceId);
}
