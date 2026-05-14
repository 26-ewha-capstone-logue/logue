-- Step 1: 컬럼 추가
ALTER TABLE ai_tagging_jobs
    ADD COLUMN analysis_flow_id BIGINT REFERENCES analysis_flows(id);

-- Step 2: 기존 NULL 데이터 백필 (롤백 시 NOT NULL 복구 가능하도록)
UPDATE ai_tagging_jobs
    SET message_id = 0 WHERE message_id IS NULL;
UPDATE ai_tagging_jobs
    SET started_at = created_at WHERE started_at IS NULL;

-- Step 3: NOT NULL 해제
ALTER TABLE ai_tagging_jobs
    ALTER COLUMN message_id DROP NOT NULL,
    ALTER COLUMN started_at DROP NOT NULL;

-- Rollback SQL (롤백 시 실행):
-- UPDATE ai_tagging_jobs SET message_id = 0 WHERE message_id IS NULL;
-- UPDATE ai_tagging_jobs SET started_at = created_at WHERE started_at IS NULL;
-- ALTER TABLE ai_tagging_jobs ALTER COLUMN message_id SET NOT NULL;
-- ALTER TABLE ai_tagging_jobs ALTER COLUMN started_at SET NOT NULL;
-- ALTER TABLE ai_tagging_jobs DROP COLUMN analysis_flow_id;

CREATE INDEX idx_ai_tagging_jobs_analysis_flow_id
    ON ai_tagging_jobs (analysis_flow_id);