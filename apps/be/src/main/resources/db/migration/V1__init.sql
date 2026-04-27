-- ==============================
-- TABLES
-- ==============================

-- 사용자
CREATE TABLE users
(
    id               BIGSERIAL PRIMARY KEY,
    created_at       TIMESTAMPTZ  NOT NULL,
    updated_at       TIMESTAMPTZ  NOT NULL,
    email            VARCHAR(255) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    name             VARCHAR(255) NOT NULL,
    provider         VARCHAR(30)  NOT NULL,
    profile_image_url VARCHAR(255),
    domain           VARCHAR(255),
    frequent_work    VARCHAR(255),
    data_tool        VARCHAR(255)
);

CREATE UNIQUE INDEX idx_users_provider_user_id
    ON users (provider_user_id);

-- 데이터 소스
CREATE TABLE data_sources
(
    id           BIGSERIAL PRIMARY KEY,
    created_at   TIMESTAMPTZ  NOT NULL,
    user_id      BIGINT       NOT NULL REFERENCES users (id),
    file_name    VARCHAR(255) NOT NULL,
    file_size    BIGINT       NOT NULL,
    storage_key  TEXT,
    schema_json  JSONB        NOT NULL,
    data_status  JSONB,
    row_count    INT          NOT NULL,
    column_count INT          NOT NULL
);

CREATE INDEX idx_data_sources_user_id
    ON data_sources (user_id);
CREATE INDEX idx_data_sources_user_id_created_at
    ON data_sources (user_id, created_at);

-- 데이터 소스 컬럼 메타데이터
CREATE TABLE data_source_columns
(
    id             BIGSERIAL PRIMARY KEY,
    created_at     TIMESTAMPTZ  NOT NULL,
    updated_at     TIMESTAMPTZ  NOT NULL,
    data_source_id BIGINT       NOT NULL REFERENCES data_sources (id),
    column_name    VARCHAR(255) NOT NULL,
    data_type      VARCHAR(255) NOT NULL,
    null_ratio     DOUBLE PRECISION NOT NULL,
    unique_ratio   DOUBLE PRECISION NOT NULL,
    sample_values  JSONB        NOT NULL
);

CREATE INDEX idx_data_source_columns_data_source_id
    ON data_source_columns (data_source_id);
CREATE INDEX idx_data_source_columns_data_source_id_column_name
    ON data_source_columns (data_source_id, column_name);

-- 데이터 소스 수준 경고 (code: SourceWarningKey)
CREATE TABLE source_data_warnings
(
    id             BIGSERIAL PRIMARY KEY,
    created_at     TIMESTAMPTZ  NOT NULL,
    updated_at     TIMESTAMPTZ  NOT NULL,
    data_source_id BIGINT       NOT NULL REFERENCES data_sources (id),
    code           VARCHAR(50)  NOT NULL,
    name           VARCHAR(255) NOT NULL,
    comment        VARCHAR(255) NOT NULL,
    priority       INT
);

-- 대화
CREATE TABLE conversations
(
    id         BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ  NOT NULL,
    updated_at TIMESTAMPTZ  NOT NULL,
    user_id    BIGINT       NOT NULL REFERENCES users (id),
    title      VARCHAR(255) NOT NULL
);

CREATE INDEX idx_conversations_user_id
    ON conversations (user_id);
CREATE INDEX idx_conversations_user_id_created_at
    ON conversations (user_id, created_at);

-- 분석 플로우
CREATE TABLE analysis_flows
(
    id              BIGSERIAL PRIMARY KEY,
    created_at      TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL,
    conversation_id BIGINT      NOT NULL REFERENCES conversations (id),
    data_source_id  BIGINT      NOT NULL REFERENCES data_sources (id)
);

CREATE INDEX idx_analysis_flows_conversation_id
    ON analysis_flows (conversation_id);
CREATE INDEX idx_analysis_flows_data_source_id
    ON analysis_flows (data_source_id);
CREATE INDEX idx_analysis_flows_conversation_id_created_at
    ON analysis_flows (conversation_id, created_at);

-- 메시지 (role: MessageRole — USER / LOGUE)
CREATE TABLE messages
(
    id               BIGSERIAL PRIMARY KEY,
    created_at       TIMESTAMPTZ NOT NULL,
    analysis_flow_id BIGINT      NOT NULL REFERENCES analysis_flows (id),
    role             VARCHAR(20) NOT NULL,
    content          TEXT        NOT NULL
);

CREATE INDEX idx_messages_analysis_flow_id
    ON messages (analysis_flow_id);
CREATE INDEX idx_messages_analysis_flow_id_created_at
    ON messages (analysis_flow_id, created_at);
CREATE INDEX idx_messages_analysis_flow_id_role_created_at
    ON messages (analysis_flow_id, role, created_at);

-- 분석 플로우 컬럼 시맨틱 역할 매핑 (semantic_role: SemanticRoleType)
CREATE TABLE analysis_flow_columns
(
    id                   BIGSERIAL PRIMARY KEY,
    created_at           TIMESTAMPTZ NOT NULL,
    updated_at           TIMESTAMPTZ NOT NULL,
    analysis_flow_id     BIGINT      NOT NULL REFERENCES analysis_flows (id),
    data_source_column_id BIGINT     NOT NULL REFERENCES data_source_columns (id),
    semantic_role        VARCHAR(30) NOT NULL
);

CREATE INDEX idx_analysis_flow_columns_analysis_flow_id
    ON analysis_flow_columns (analysis_flow_id);
CREATE INDEX idx_analysis_flow_columns_data_source_column_id
    ON analysis_flow_columns (data_source_column_id);
CREATE INDEX idx_analysis_flow_columns_flow_id_column_id
    ON analysis_flow_columns (analysis_flow_id, data_source_column_id);

-- 분석 기준 (analysis_type: AnalysisType, metric_type: MetricType)
CREATE TABLE analysis_criteria
(
    id                 BIGSERIAL PRIMARY KEY,
    created_at         TIMESTAMPTZ  NOT NULL,
    updated_at         TIMESTAMPTZ  NOT NULL,
    analysis_flow_id   BIGINT       NOT NULL REFERENCES analysis_flows (id),
    analysis_type      VARCHAR(20)  NOT NULL,
    metric_name        VARCHAR(255) NOT NULL,
    metric_type        VARCHAR(20)  NOT NULL,
    formula_numerator  VARCHAR(255),
    formula_denominator VARCHAR(255),
    base_date_column   VARCHAR(255) NOT NULL,
    standard_period    VARCHAR(255) NOT NULL,
    compare_period     VARCHAR(255),
    sort_by            VARCHAR(255) NOT NULL,
    sort_direction     VARCHAR(10)  NOT NULL,
    group_by           JSONB        NOT NULL,
    limit_num          BIGINT,
    filters            JSONB,
    data_warnings      JSONB,
    is_confirmed       BOOLEAN,
    confirmed_at       TIMESTAMPTZ
);

CREATE INDEX idx_analysis_criteria_analysis_flow_id
    ON analysis_criteria (analysis_flow_id);
CREATE INDEX idx_analysis_criteria_analysis_flow_id_created_at
    ON analysis_criteria (analysis_flow_id, created_at);
CREATE INDEX idx_analysis_criteria_analysis_flow_id_is_confirmed
    ON analysis_criteria (analysis_flow_id, is_confirmed);

-- 분석 기준 수준 경고 (code: FlowWarningKey)
CREATE TABLE flow_data_warnings
(
    id                   BIGSERIAL PRIMARY KEY,
    created_at           TIMESTAMPTZ  NOT NULL,
    updated_at           TIMESTAMPTZ  NOT NULL,
    analysis_criteria_id BIGINT       NOT NULL REFERENCES analysis_criteria (id),
    code                 VARCHAR(50)  NOT NULL,
    name                 VARCHAR(255) NOT NULL,
    comment              VARCHAR(255) NOT NULL,
    priority             INT
);

-- 분석 결과
CREATE TABLE analysis_results
(
    id                   BIGSERIAL PRIMARY KEY,
    created_at           TIMESTAMPTZ  NOT NULL,
    analysis_criteria_id BIGINT       NOT NULL REFERENCES analysis_criteria (id),
    description          VARCHAR(255) NOT NULL,
    chart_data           JSONB        NOT NULL,
    data_warnings        JSONB
);

CREATE UNIQUE INDEX idx_analysis_results_analysis_criteria_id
    ON analysis_results (analysis_criteria_id);
CREATE INDEX idx_analysis_results_analysis_criteria_id_created_at
    ON analysis_results (analysis_criteria_id, created_at);

-- AI 태깅 작업 (stage: JobStage, status: JobStatus)
CREATE TABLE ai_tagging_jobs
(
    id              BIGSERIAL PRIMARY KEY,
    created_at      TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL,
    conversation_id BIGINT      NOT NULL REFERENCES conversations (id),
    analysis_flow_id BIGINT     NOT NULL REFERENCES analysis_flows (id),
    message_id      BIGINT      REFERENCES messages (id),
    stage           VARCHAR(30) NOT NULL,
    status          VARCHAR(20) NOT NULL,
    error_message   TEXT,
    request_payload JSONB,
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ
);

CREATE INDEX idx_ai_tagging_jobs_conversation_id
    ON ai_tagging_jobs (conversation_id);
CREATE INDEX idx_ai_tagging_jobs_analysis_flow_id
    ON ai_tagging_jobs (analysis_flow_id);
CREATE INDEX idx_ai_tagging_jobs_message_id
    ON ai_tagging_jobs (message_id);
CREATE INDEX idx_ai_tagging_jobs_conversation_id_stage
    ON ai_tagging_jobs (conversation_id, stage);
CREATE INDEX idx_ai_tagging_jobs_conversation_id_stage_status
    ON ai_tagging_jobs (conversation_id, stage, status);
CREATE INDEX idx_ai_tagging_jobs_conversation_id_created_at
    ON ai_tagging_jobs (conversation_id, created_at);

CREATE TABLE refresh_tokens
(
    id         BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    user_id    BIGINT      NOT NULL REFERENCES users (id),
    token      TEXT        NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);