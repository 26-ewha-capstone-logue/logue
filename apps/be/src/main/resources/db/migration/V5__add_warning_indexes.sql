-- 데이터 경고 조회 인덱스 추가.
-- source_data_warnings / flow_data_warnings 의 FK 컬럼에 인덱스가 없어
-- findByDataSourceId / findByAnalysisCriteriaId 조회 시 Seq Scan 이 발생한다.
CREATE INDEX IF NOT EXISTS idx_source_data_warnings_data_source_id
    ON source_data_warnings (data_source_id);

CREATE INDEX IF NOT EXISTS idx_flow_data_warnings_analysis_criteria_id
    ON flow_data_warnings (analysis_criteria_id);
