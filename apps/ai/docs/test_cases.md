# 📋 AI 모듈 테스트 케이스 (Notion 붙여넣기용)

> 노션에 정리하기 위한 마크다운 파일.
> `test/fixtures/test-cases.json` 구조 (id / datasetId / question / expected / note) 기반.
> Predefined Metrics 12개 기반 — 총 51 케이스.

---

## 0. 공통 정의

### Predefined Metrics (12개)


| metric_name              | metric_type | numerator            | denominator      |
| ------------------------ | ----------- | -------------------- | ---------------- |
| signup_conversion_rate   | RATIO       | signup_complete      | landing_sessions |
| activation_rate          | RATIO       | activated_users      | signup_complete  |
| trial_start_rate         | RATIO       | trial_start          | landing_sessions |
| paid_conversion_rate     | RATIO       | paid_users           | trial_start      |
| purchase_conversion_rate | RATIO       | purchase_complete    | product_view     |
| checkout_completion_rate | RATIO       | checkout_complete    | checkout_start   |
| retention_rate           | RATIO       | retained_users       | active_users     |
| churn_rate               | RATIO       | churned_users        | active_users     |
| campaign_conversion_rate | RATIO       | campaign_conversions | campaign_visits  |
| support_resolution_rate  | RATIO       | resolved_tickets     | support_tickets  |
| click_through_rate       | RATIO       | ad_clicks            | ad_impressions   |
| email_open_rate          | RATIO       | email_opens          | email_sends      |


> `supported_periods`: `["1D", "1W", "1M", "3M", "1Y"]`

### Datasets (5종)


| dataset_id  | 도메인     | DATE_CRITERIA | DIMENSION                 | MEASURE                                                                                    |
| ----------- | ------- | ------------- | ------------------------- | ------------------------------------------------------------------------------------------ |
| saas_funnel | SaaS 가입 | event_date    | channel, device           | landing_sessions, signup_complete, activated_users, trial_start, paid_users                |
| ecommerce   | 이커머스    | order_date    | category, device          | product_view, checkout_start, checkout_complete, purchase_complete                         |
| marketing   | 마케팅     | log_date      | campaign_name, channel    | ad_impressions, ad_clicks, campaign_visits, campaign_conversions, email_sends, email_opens |
| retention   | 리텐션     | cohort_date   | segment, plan_type        | active_users, retained_users, churned_users                                                |
| support     | 고객지원    | ticket_date   | support_channel, priority | support_tickets, resolved_tickets                                                          |


---

# 📋 02 Question Analysis Test Cases

## 1. Comparison 케이스 (CMP-01 ~ CMP-10)


| id     | dataset     | metric                   | question                                      | period   | group_by        | 방향   |
| ------ | ----------- | ------------------------ | --------------------------------------------- | -------- | --------------- | ---- |
| CMP-01 | saas_funnel | signup_conversion_rate   | 이번 주 가입 전환율이 지난주 대비 가장 많이 떨어진 채널·디바이스를 알려줘    | 1W vs 1W | channel, device | asc  |
| CMP-02 | saas_funnel | activation_rate          | 이번 달 채널별 액티베이션율이 지난달 대비 가장 떨어진 곳은?            | 1M vs 1M | channel         | asc  |
| CMP-03 | saas_funnel | trial_start_rate         | 지난주 대비 이번 주 트라이얼 시작율이 가장 많이 떨어진 디바이스를 보여줘     | 1W vs 1W | device          | asc  |
| CMP-04 | saas_funnel | paid_conversion_rate     | 이번 분기 유료 전환율이 직전 분기 대비 가장 많이 하락한 채널·디바이스 조합은? | 3M vs 3M | channel, device | asc  |
| CMP-05 | ecommerce   | purchase_conversion_rate | 이번 주 카테고리별 구매 전환율이 지난주 대비 가장 많이 떨어진 곳을 보여줘    | 1W vs 1W | category        | asc  |
| CMP-06 | ecommerce   | checkout_completion_rate | 이번 달 디바이스별 결제 완료율이 지난달 대비 어디서 가장 많이 떨어졌어?     | 1M vs 1M | device          | asc  |
| CMP-07 | retention   | retention_rate           | 이번 달 세그먼트별 리텐션율이 지난달 대비 가장 많이 떨어진 곳은?         | 1M vs 1M | segment         | asc  |
| CMP-08 | retention   | churn_rate               | 이번 분기 플랜별 이탈율이 직전 분기 대비 가장 크게 증가한 플랜은?        | 3M vs 3M | plan_type       | desc |
| CMP-09 | marketing   | campaign_conversion_rate | 이번 주 캠페인별 전환율이 지난주 대비 가장 많이 떨어진 캠페인을 보여줘      | 1W vs 1W | campaign_name   | asc  |
| CMP-10 | support     | support_resolution_rate  | 이번 달 채널별 티켓 해결율이 지난달 대비 가장 많이 떨어진 곳을 알려줘      | 1M vs 1M | support_channel | asc  |


### CMP 상세 expected JSON (CMP-01 예시 — 나머지도 동일 패턴)

```json
{
  "id": "CMP-01",
  "dataset_id": "saas_funnel",
  "question": "이번 주 가입 전환율이 지난주 대비 가장 많이 떨어진 채널·디바이스를 알려줘",
  "expected": {
    "analysis_criteria": {
      "analysis_type": "COMPARISON",
      "metric_name": "signup_conversion_rate",
      "metric_type": "RATIO",
      "formula_numerator": "signup_complete",
      "formula_denominator": "landing_sessions",
      "base_date_column": "event_date",
      "standard_period": "1W",
      "compare_period": "1W",
      "sort_by": "delta",
      "sort_direction": "asc",
      "group_by": ["channel", "device"],
      "limit_num": 1,
      "filters": []
    },
    "warnings": [],
    "unsupported_question": null
  }
}
```

---

## 2. Ranking 케이스 (RNK-01 ~ RNK-10)


| id     | dataset     | metric                   | question                            | period | group_by         | limit | 방향   |
| ------ | ----------- | ------------------------ | ----------------------------------- | ------ | ---------------- | ----- | ---- |
| RNK-01 | saas_funnel | signup_conversion_rate   | 이번 주 가입 전환율이 가장 낮은 채널·디바이스 top 5    | 1W     | channel, device  | 5     | asc  |
| RNK-02 | ecommerce   | purchase_conversion_rate | 이번 달 카테고리별 구매 전환율 top 10            | 1M     | category         | 10    | desc |
| RNK-03 | saas_funnel | activation_rate          | 이번 달 채널별 액티베이션율 낮은 순으로 5개           | 1M     | channel          | 5     | asc  |
| RNK-04 | saas_funnel | paid_conversion_rate     | 지난 한 달 디바이스별 유료 전환율 하위 3개           | 1M     | device           | 3     | asc  |
| RNK-05 | marketing   | click_through_rate       | 이번 주 캠페인별 클릭률 top 5                 | 1W     | campaign_name    | 5     | desc |
| RNK-06 | marketing   | email_open_rate          | 이번 달 채널별 이메일 오픈율이 가장 낮은 5개          | 1M     | channel          | 5     | asc  |
| RNK-07 | marketing   | campaign_conversion_rate | 지난 일주일 캠페인 전환율 top 5                | 1W     | campaign_name    | 5     | desc |
| RNK-08 | ecommerce   | checkout_completion_rate | 이번 주 카테고리·디바이스별 결제 완료율이 가장 낮은 5개 조합 | 1W     | category, device | 5     | asc  |
| RNK-09 | retention   | retention_rate           | 지난 분기 플랜별 리텐션율이 높은 순으로 5개           | 3M     | plan_type        | 5     | desc |
| RNK-10 | support     | support_resolution_rate  | 이번 달 우선순위별 티켓 해결율이 가장 낮은 3개         | 1M     | priority         | 3     | asc  |


### RNK 상세 expected JSON (RNK-01 예시)

```json
{
  "id": "RNK-01",
  "dataset_id": "saas_funnel",
  "question": "이번 주 가입 전환율이 가장 낮은 채널·디바이스 top 5를 보여줘",
  "expected": {
    "analysis_criteria": {
      "analysis_type": "RANKING",
      "metric_name": "signup_conversion_rate",
      "metric_type": "RATIO",
      "formula_numerator": "signup_complete",
      "formula_denominator": "landing_sessions",
      "base_date_column": "event_date",
      "standard_period": "1W",
      "compare_period": null,
      "sort_by": "metric_value",
      "sort_direction": "asc",
      "group_by": ["channel", "device"],
      "limit_num": 5,
      "filters": []
    },
    "warnings": [],
    "unsupported_question": null
  }
}
```

---

## 3. Filter 포함 케이스 (FLT-01 ~ FLT-03)


| id     | dataset     | metric                   | question                                             | filter                            |
| ------ | ----------- | ------------------------ | ---------------------------------------------------- | --------------------------------- |
| FLT-01 | saas_funnel | signup_conversion_rate   | internal_test 계정을 제외하고, 이번 주 가입 전환율 하위 5개 채널·디바이스    | `account_flag != "internal_test"` |
| FLT-02 | ecommerce   | purchase_conversion_rate | 결제 성공 건만 대상으로, 이번 주 카테고리별 구매 전환율이 지난주 대비 가장 많이 떨어진 곳 | `payment_status = "success"`      |
| FLT-03 | support     | support_resolution_rate  | high·urgent 우선순위만 대상으로, 이번 달 채널별 해결율 하위 3개           | `priority in ["high","urgent"]`   |


### FLT-01 상세

```json
{
  "id": "FLT-01",
  "dataset_id": "saas_funnel",
  "question": "internal_test 계정을 제외하고, 이번 주 가입 전환율 하위 5개 채널·디바이스를 보여줘",
  "expected": {
    "analysis_criteria": {
      "analysis_type": "RANKING",
      "metric_name": "signup_conversion_rate",
      "metric_type": "RATIO",
      "formula_numerator": "signup_complete",
      "formula_denominator": "landing_sessions",
      "base_date_column": "event_date",
      "standard_period": "1W",
      "compare_period": null,
      "sort_by": "metric_value",
      "sort_direction": "asc",
      "group_by": ["channel", "device"],
      "limit_num": 5,
      "filters": [
        { "field": "account_flag", "operator": "!=", "value": "internal_test" }
      ]
    },
    "warnings": [],
    "unsupported_question": null
  }
}
```

---

## 4. Warning 케이스 (WRN-01 ~ WRN-03)


| id     | dataset     | 시나리오                                 | warning_code             | 처리                      |
| ------ | ----------- | ------------------------------------ | ------------------------ | ----------------------- |
| WRN-01 | saas_funnel | landing_sessions의 null_ratio = 0.42  | `critical_null_detected` | 분석은 진행 + warning        |
| WRN-02 | saas_funnel | 질문이 "지역별"인데 region 컬럼 없음             | `question_data_mismatch` | group_by에서 제거 + warning |
| WRN-03 | ecommerce   | "VIP 회원만" 필터인데 membership_tier 컬럼 없음 | `question_data_mismatch` | filter 제거 + warning     |


### WRN-01 상세

```json
{
  "id": "WRN-01",
  "dataset_id": "saas_funnel",
  "override_columns": { "landing_sessions": { "null_ratio": 0.42 } },
  "question": "이번 주 가입 전환율 하위 5개 채널·디바이스를 보여줘",
  "expected": {
    "analysis_criteria": {
      "analysis_type": "RANKING",
      "metric_name": "signup_conversion_rate",
      "metric_type": "RATIO",
      "formula_numerator": "signup_complete",
      "formula_denominator": "landing_sessions",
      "base_date_column": "event_date",
      "standard_period": "1W",
      "compare_period": null,
      "sort_by": "metric_value",
      "sort_direction": "asc",
      "group_by": ["channel", "device"],
      "limit_num": 5,
      "filters": []
    },
    "warnings": [
      { "code": "critical_null_detected", "related_fields": ["landing_sessions"] }
    ],
    "unsupported_question": null
  }
}
```

---

## 5. Unsupported 케이스 (UNS-01 ~ UNS-05)


| id     | dataset                     | question                  | reason                                                  |
| ------ | --------------------------- | ------------------------- | ------------------------------------------------------- |
| UNS-01 | saas_funnel                 | 이번 주 채널별 평균 세션 시간 top 5   | predefined catalog에 없는 metric                           |
| UNS-02 | saas_funnel                 | 지난 3개월간 일별 가입 전환율 추이를 그려줘 | TREND는 지원 안함 (COMPARISON/RANKING만)                      |
| UNS-03 | ecommerce                   | 최근 6개월 카테고리별 구매 전환율 top 5 | supported_periods 밖 (6M 미지원)                            |
| UNS-04 | ecommerce                   | 이번 주 카테고리별 가입 전환율 top 5   | metric formula 컬럼(landing_sessions, signup_complete) 없음 |
| UNS-05 | saas_funnel (event_date 제외) | 이번 주 가입 전환율 top 5 채널      | DATE_CRITERIA 컬럼 없음                                     |


### UNS-01 상세

```json
{
  "id": "UNS-01",
  "dataset_id": "saas_funnel",
  "question": "이번 주 채널별 평균 세션 시간 top 5",
  "expected": {
    "analysis_criteria": null,
    "warnings": [],
    "unsupported_question": {
      "reason": "요청한 metric이 predefined catalog에 없습니다.",
      "detected_intent": "avg_session_duration"
    }
  }
}
```

---

## 6. 컬럼 모호성 케이스 (AMB-01 ~ AMB-05)

> ⭐ 결정사항: "date 외 컬럼 role에서도 모호성 테스트" 반영


| id     | role             | 모호 상황                                                       | 처리                                                   |
| ------ | ---------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| AMB-01 | DIMENSION        | `channel`과 `source` 둘 다 "채널"로 매핑 가능                         | channel 선택 + warning                                 |
| AMB-02 | MEASURE          | `signup_complete`와 `signups` 둘 다 가입 수                       | predefined formula 기준 `signup_complete` 선택 + warning |
| AMB-03 | STATUS_CONDITION | `payment_status`와 `order_status` 둘 다 후보                     | payment_status 선택 + warning                          |
| AMB-04 | FLAG             | `account_flag`(string)와 `is_test_account`(boolean) 모두 매핑 가능 | boolean 우선 선택 + warning                              |
| AMB-05 | DATE_CRITERIA    | `event_date`와 `created_at` 둘 다 존재                           | unsupported (01에서 date_field_conflict 떴어야 함)         |


### AMB-01 상세

```json
{
  "id": "AMB-01",
  "dataset_id": "saas_funnel",
  "override_columns": {
    "source": {
      "add": true, "data_type": "string", "semantic_role": "DIMENSION",
      "sample_values": ["paid_search", "organic"]
    }
  },
  "question": "이번 주 채널별 가입 전환율 top 5",
  "expected": {
    "analysis_criteria": {
      "analysis_type": "RANKING",
      "metric_name": "signup_conversion_rate",
      "metric_type": "RATIO",
      "formula_numerator": "signup_complete",
      "formula_denominator": "landing_sessions",
      "base_date_column": "event_date",
      "standard_period": "1W",
      "compare_period": null,
      "sort_by": "metric_value",
      "sort_direction": "asc",
      "group_by": ["channel"],
      "limit_num": 5,
      "filters": []
    },
    "warnings": [
      {
        "code": "question_data_mismatch",
        "related_fields": ["channel", "source"],
        "detail": "'채널'이 channel/source 두 컬럼에 모두 매핑 가능. channel 우선 선택."
      }
    ],
    "unsupported_question": null
  }
}
```

---

## 7. Error 케이스 (ERR-01 ~ ERR-02)


| id     | 시나리오       | 예상 응답                             |
| ------ | ---------- | --------------------------------- |
| ERR-01 | 빈 질문 `""`  | HTTP 422 (schema validation)      |
| ERR-02 | "ㅋㅋㅋㅋㅋ 안녕" | `unsupported_question` (분석 의도 없음) |


---

# 📋 01 File Analysis Test Cases


| id    | 시나리오                                                       | 핵심 검증                         | expected_warnings     |
| ----- | ---------------------------------------------------------- | ----------------------------- | --------------------- |
| FA-01 | 표준 SaaS funnel (date+dim+measure)                          | 기본 role 태깅                    | []                    |
| FA-02 | ID + FLAG + STATUS 포함                                      | string ID/flag/status 구분      | []                    |
| FA-03 | date 컬럼 없음 (products.csv)                                  | NO_DATE_COLUMN 발생             | `NO_DATE_COLUMN`      |
| FA-04 | date 컬럼 3개 (created_at, signup_date, event_logged_at)      | 모호성 감지                        | `date_field_conflict` |
| FA-05 | landing_sessions null_ratio = 0.45                         | 01에서는 role만 판단, warning은 02에서 | []                    |
| FA-06 | category(DIMENSION) vs payment_status(STATUS_CONDITION) 구분 | unique_ratio + 의미로 구분         | []                    |


### FA-04 (date_field_conflict) 상세

```json
{
  "id": "FA-04",
  "input": {
    "file_name": "mixed_dates.csv",
    "row_count": 1000,
    "column_count": 5,
    "columns": [
      { "column_name": "created_at",       "data_type": "datetime", "null_ratio": 0.0, "unique_ratio": 0.9,  "sample_values": ["2026-04-06T08:20:00Z"] },
      { "column_name": "signup_date",      "data_type": "date",     "null_ratio": 0.0, "unique_ratio": 0.05, "sample_values": ["2026-04-06"] },
      { "column_name": "event_logged_at",  "data_type": "datetime", "null_ratio": 0.0, "unique_ratio": 1.0,  "sample_values": ["2026-04-07T00:01:00Z"] },
      { "column_name": "channel",          "data_type": "string",   "null_ratio": 0.0, "unique_ratio": 0.01, "sample_values": ["paid_search"] },
      { "column_name": "signup_complete",  "data_type": "integer",  "null_ratio": 0.0, "unique_ratio": 0.4,  "sample_values": [20] }
    ]
  },
  "expected": {
    "column_roles": {
      "created_at": "DATE_CRITERIA",
      "signup_date": "DATE_CRITERIA",
      "event_logged_at": "DATE_CRITERIA",
      "channel": "DIMENSION",
      "signup_complete": "MEASURE"
    },
    "warnings": [
      { "code": "date_field_conflict", "related_columns": ["created_at", "signup_date", "event_logged_at"] }
    ]
  }
}
```

---

# 📋 03 Result Summary Test Cases


| id    | analysis_type | 시나리오                                 | 기대 텍스트 키워드                           |
| ----- | ------------- | ------------------------------------ | ------------------------------------ |
| RS-01 | COMPARISON    | paid_search·mobile에서 5%p 하락          | "paid_search", "mobile", "5%p", "하락" |
| RS-02 | COMPARISON    | enterprise 세그먼트 8%p 상승               | "enterprise", "8%p", "상승"            |
| RS-03 | RANKING       | 카테고리별 구매 전환율 top 5 (Electronics 12%) | "Electronics", "12%", "가장 높은"        |
| RS-04 | RANKING       | 우선순위별 해결율 하위 3 (urgent 42%)          | "urgent", "42%", "가장 낮은"             |
| RS-05 | RANKING       | rows = []                            | "데이터가 없습니다"                          |
| RS-06 | RANKING       | rows 1개만 (newsletter 34%)            | "newsletter", "34%"                  |
| RS-07 | RANKING       | null 값 포함 row 존재                     | null row 제외, "Books", "30%"          |


### RS-01 상세

```json
{
  "id": "RS-01",
  "input": {
    "analysis_criteria": {
      "analysis_type": "COMPARISON",
      "metric_name": "signup_conversion_rate",
      "metric_display_name": "가입 전환율",
      "standard_period": "1W",
      "compare_period": "1W",
      "group_by": ["channel", "device"],
      "sort_by": "delta",
      "sort_direction": "asc",
      "limit_num": 1
    },
    "chart_data": {
      "columns": ["channel", "device", "current", "previous", "delta"],
      "rows": [["paid_search", "mobile", 0.04, 0.09, -0.05]]
    },
    "locale": "ko-KR"
  },
  "expected_contains": ["paid_search", "mobile", "5%p", "하락"]
}
```

---

# 📊 총 51 케이스


| 분류                     | 개수     |
| ---------------------- | ------ |
| 02 Comparison (CMP)    | 10     |
| 02 Ranking (RNK)       | 10     |
| 02 Filter (FLT)        | 3      |
| 02 Warning (WRN)       | 3      |
| 02 Unsupported (UNS)   | 5      |
| 02 Ambiguity (AMB)     | 5      |
| 02 Error (ERR)         | 2      |
| 01 File Analysis (FA)  | 6      |
| 03 Result Summary (RS) | 7      |
| **합계**                 | **51** |


