# 파일 분석 API smoke 테스트

`POST /v1/llm/data-sources/analyze` 의 실제 LLM 호출 동작을 빠르게 확인하기 위한 smoke 스크립트. 단위 테스트(`apps/ai/tests/test_file_analysis*.py`)는 mock 으로만 검증하므로 v1 prompt + Structured Outputs + 후처리 흐름이 실제 OpenAI 응답에서도 작동하는지 한 번은 직접 호출해 확인한다.

평가용 자동 채점은 별도다 — `apps/ai/eval/` 하네스 + 평가 케이스 적재 (`#261 fa-eval-cases`). 본 디렉토리는 운영 사전 점검·prompt 변경 시 회귀 확인 용도.

> 페이로드는 모두 JSON. 원본 CSV 가 아니라 BE 가 프로파일링해서 만든 메타데이터 (`row_count` · `column_count` · 컬럼별 `data_type` / `null_ratio` / `unique_ratio` / `sample_values`) 만 들어간다.

## 사전 준비

1. **API Key 설정** — `apps/ai/.env` 에 OPENAI_API_KEY 박아두기 (이미 gitignore 됨):

    ```bash
    # apps/ai/.env
    OPENAI_API_KEY=sk-...
    ```

2. **서버 띄우기** — 다른 터미널에서:

    ```bash
    cd apps/ai
    PYTHONPATH= ./.venv/bin/python -m uvicorn main:app --reload --env-file .env --port 8000
    ```

    `Application startup complete.` 가 보이면 준비 끝.

## 실행

```bash
cd apps/ai/smoke/file_analysis
bash run.sh
```

다른 호스트/포트로 띄웠으면 환경변수로 덮어쓰기:

```bash
SMOKE_HOST=http://localhost:9000 bash run.sh
```

## 시나리오

| 페이로드 | 케이스 | 기대 결과 |
|---|---|---|
| `01_en_saas_funnel.json` | 표준 SaaS funnel (영문 컬럼명) | 200, `event_date`=DATE_CRITERIA / `channel`·`device`=DIMENSION / `landing_sessions`·`signup_complete`=MEASURE, `warnings=[]` |
| `02_korean_date_conflict.json` | 한국어 컬럼명 + `date` + `datetime` 혼합 | 200, `주문일자`·`결제완료시각`=DATE_CRITERIA / `결제완료`=STATUS_CONDITION / `주문번호`=ID_CRITERIA / `결제금액`=MEASURE, `warnings[0].code = DATE_FIELD_CONFLICT` (후처리) |
| `03_ambiguous_columns_fallback.json` | 모호한 컬럼명 (`value`/`count`/`total`) | 200, `user_id`=ID_CRITERIA / `value`·`count`=MEASURE (numeric fallback) / `total`=DIMENSION (string fallback), `warnings=[]` |

## 검증 포인트

- HTTP **200** 응답
- `request_id` 가 페이로드 값과 그대로 일치 (orchestration 후처리에서 입력값으로 overwrite)
- `column_roles[]` 길이 = 입력 컬럼 수, `column_name` 1:1 매칭
- `data_status_summary.primary_candidates` 의 6개 키(`date_fields`·`measures`·`dimensions`·`status_conditions`·`flags`·`ids`) 모두 노출 (빈 배열이라도)
- `warnings` 는 코드 결정론: `column_roles` 에서 `semantic_role == DATE_CRITERIA` 인 컬럼이 2개 이상이면 `DATE_FIELD_CONFLICT` 1건, 그 외 `[]`. LLM 이 warnings 를 뱉어도 무시되고 `core.rules.date_conflict_warnings()` 결과로 덮어쓴다

## 결과 저장 위치

실행할 때마다 `results/<YYYYMMDD-HHMMSS>/` 디렉토리가 생성되고 다음 파일이 저장됩니다.

| 파일 | 내용 |
|---|---|
| `<name>.response.json` | LLM/mock 의 원본 응답 (raw 데이터 미포함) |
| `<name>.request.masked.json` | 요청 페이로드의 `sample_values`·`file_name` 을 마스킹한 사본 |
| `<name>.meta.json` | 호출 메타 (시나리오 이름, HTTP 코드) |
| `SUMMARY.md` | 시나리오별 결과 표 + 검증 체크리스트 |

`results/` 는 `.gitignore` 대상이라 커밋에 잡히지 않습니다. PR 본문이나 평가 자료에 필요하면 `SUMMARY.md` 만 복사해서 붙여 넣으면 됩니다.

### 마스킹 정책

운영 환경의 실제 요청에는 PII / 비즈니스 데이터가 들어올 수 있으므로 결과 저장 시 다음 필드를 일괄 마스킹합니다.

- `sample_values[]` → 항목별 `<masked:<type>>`
- `file_name` → `<masked:<type>>`

응답은 컬럼명·`semantic_role`·`confidence`·warning code 만 포함하므로 raw 데이터가 없고, 그대로 보관합니다. 마스킹 안 된 원본 요청(`<name>.request.json`) 은 `summarize.py` 가 마스킹 적용 후 즉시 삭제합니다 (실수 커밋 방지).

## mock 모드 비교 (LLM 비용 없이 흐름만 확인)

```bash
cd apps/ai
ANAL_LLM_MOCK=true PYTHONPATH= ./.venv/bin/python -m uvicorn main:app --reload --port 8000
```

→ 같은 `bash run.sh` 가 `_build_mock_response` 의 rule-based 결정론적 응답으로 200 을 반환. role 분류는 LLM 호출과 다를 수 있으나 schema·후처리·`DATE_FIELD_CONFLICT` 흐름은 동일하게 통과해야 한다.
