ALTER TABLE ai_tagging_jobs
    ADD COLUMN analysis_flow_id BIGINT REFERENCES analysis_flows(id),
    ALTER COLUMN message_id DROP NOT NULL,
    ALTER COLUMN started_at DROP NOT NULL;

CREATE INDEX idx_ai_tagging_jobs_analysis_flow_id
    ON ai_tagging_jobs (analysis_flow_id);