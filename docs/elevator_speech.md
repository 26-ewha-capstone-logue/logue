![Logue Banner](https://raw.githubusercontent.com/26-ewha-capstone-logue/logue/main/assets/banner.png)

# Logue

## Question-first 분석 지원 서비스

Logue: 자연어 질문을 분석 가능한 조건으로 바꾸는 Question-first 분석 지원 웹 서비스

---

# 1. 문제

## 고객과 반복 질문

마케팅, 기획, 운영 실무자는 업무 중 CSV나 엑셀 파일을 받아 성과 수치를 직접 확인해야 하는 순간이 많습니다.

| Target User | 주요 업무 | 반복 질문 |
| --- | --- | --- |
| 마케팅 실무자 | 캠페인·채널 성과 확인 | 어느 채널에서 전환율이 떨어졌지? |
| 기획 실무자 | 서비스 지표 변화 설명 | 이번 주 수치가 왜 변했지? |
| 운영 실무자 | 세그먼트별 성과 점검 | 어떤 조건에서 문제가 커졌지? |

## 업무 흐름의 병목

문제는 이런 질문이 바로 분석 조건이 되지 않는다는 점입니다.
지표 정의, 기준일, 비교 기간, 그룹 기준, 필터 조건을 매번 직접 정리해야 합니다.

```mermaid
%%{init: {"theme": "base", "themeVariables": {"fontFamily": "Pretendard, Inter, sans-serif", "primaryColor": "#EEF6FF", "primaryBorderColor": "#2563EB", "lineColor": "#64748B", "textColor": "#0F172A"}}}%%
flowchart LR
    A[성과 수치 확인] --> B[원인 설명 필요]
    B --> C[대시보드 확인]
    C --> D[엑셀 재가공]
    D --> E[기준 재확인]
    E --> F[보고/공유]

    C -. 막힘 .-> C1[원하는 기준이 없음]
    D -. 막힘 .-> D1[필터·기준일 흔들림]
    E -. 막힘 .-> E1[계산 기준 설명 어려움]

    classDef work fill:#EEF6FF,stroke:#2563EB,color:#0F172A,stroke-width:1.4px;
    classDef pain fill:#FFF1F2,stroke:#E11D48,color:#7F1D1D,stroke-width:1.4px;
    class A,B,C,D,E,F work;
    class C1,D1,E1 pain;
```

## Pain Point 구조

| 업무 상황 | 표면적 행동 | 실제 병목 |
| --- | --- | --- |
| 대시보드 확인 | 화면에서 지표를 찾음 | 원하는 기준으로 쪼개 보기 어려움 |
| 엑셀 재가공 | CSV를 내려받아 직접 계산 | 기준일·필터·지표 정의가 흔들림 |
| 데이터팀 요청 | 질문을 다시 정리해 전달 | 자연어 질문을 분석 조건으로 바꿔야 함 |
| 결과 공유 | 숫자를 보고서에 붙임 | 계산 기준을 설명하기 어려움 |

## Painkiller / Vitamin 구분

| 구분 | 예시 기능 | 업무 영향 |
| --- | --- | --- |
| Vitamin | 예쁜 차트, 자동 요약, 리포트 생성 | 편의성 개선 |
| Painkiller | 질문 구조화, 계산 기준 확인, 모호성 감지 | 결과 신뢰와 공유 가능성 확보 |

---

# 2. 해결 아이디어

## 해결 방향

### Before / After

사용자가 자연어로 질문하고 CSV를 업로드하면, Logue는 질문을 분석 조건으로 구조화한 뒤 결과와 계산 기준을 함께 보여줍니다.

| Before | After |
| --- | --- |
| “이번 주 가입 전환율이 왜 떨어졌지?” | 분석 가능한 조건으로 구조화 |
| 기준일을 직접 판단 | 기준일 후보를 명시 |
| 엑셀에서 직접 그룹화 | 채널·디바이스·유저 유형별 자동 비교 |
| 결과만 확인 | 결과 + 계산 기준 함께 확인 |

## 질문 변환 예시

| 사용자 질문 |
| --- |
| “이번 주 가입 전환율이 지난주 대비 어디에서 가장 많이 떨어졌어?” |

| 분석 조건 | Logue 해석 |
| --- | --- |
| 분석 유형 | ranking / comparison |
| 지표 | 가입 전환율 |
| 계산식 | signup_complete / landing_sessions |
| 기준일 | signup_date |
| 비교 기간 | 이번 주 vs 지난주 |
| 그룹 기준 | channel, device, user_type |
| 제외 조건 | internal_test 제외 |
| 정렬 기준 | 전환율 하락폭 기준 오름차순 |

## 서비스 흐름

```mermaid
%%{init: {"theme": "base", "themeVariables": {"fontFamily": "Pretendard, Inter, sans-serif", "primaryColor": "#F8FAFC", "primaryBorderColor": "#0F766E", "lineColor": "#475569", "textColor": "#0F172A"}}}%%
flowchart LR
    Q[자연어 질문] --> P[질문 해석]
    P --> S[분석 조건 구조화]
    S --> C[CSV 메타데이터 분석]
    C --> R[기준·경고 출력]
    R --> E[계산 기준 표시]

    classDef input fill:#ECFEFF,stroke:#0891B2,color:#164E63,stroke-width:1.4px;
    classDef logic fill:#F0FDFA,stroke:#0F766E,color:#134E4A,stroke-width:1.4px;
    classDef output fill:#F8FAFC,stroke:#475569,color:#0F172A,stroke-width:1.4px;
    class Q input;
    class P,S,C logic;
    class R,E output;
```

## 결과 단위

| 결과 영역 | 제공 내용 |
| --- | --- |
| 분석 결과 | 전환율, 변화량, 순위 |
| 기준 정보 | 지표 정의, 기준일, 비교 기간 |
| 그룹 정보 | channel, device, user_type |
| 필터 정보 | internal_test 제외 등 |
| 경고 정보 | 기준이 불명확한 경우 확인 요청 |

---

# 3. 기술 / 구현

## 구현 흐름

```mermaid
%%{init: {"theme": "base", "themeVariables": {"fontFamily": "Pretendard, Inter, sans-serif", "primaryColor": "#F8FAFC", "primaryBorderColor": "#334155", "lineColor": "#64748B", "textColor": "#0F172A"}}}%%
flowchart LR
    A[Next.js 화면<br/>질문·CSV 입력] --> B[Spring Boot API<br/>CSV 업로드·저장]
    B --> C[Spring CSV Parser<br/>헤더·샘플·통계 추출]
    C --> D[FastAPI AI 서버<br/>컬럼 역할 태깅]
    D --> E[Pydantic Schema<br/>응답 계약 검증]
    E --> F[Next.js 결과 화면<br/>기준·경고 표시]

    classDef fe fill:#EFF6FF,stroke:#2563EB,color:#1E3A8A,stroke-width:1.4px;
    classDef be fill:#F0FDF4,stroke:#16A34A,color:#14532D,stroke-width:1.4px;
    classDef ai fill:#FFF7ED,stroke:#EA580C,color:#7C2D12,stroke-width:1.4px;
    class A,F fe;
    class B,C be;
    class D,E ai;
```

## 역할 분담

| 영역 | 담당 역할 | 핵심 산출물 |
| --- | --- | --- |
| Frontend | 질문 입력, CSV 업로드, 결과 화면 | Next.js 기반 사용자 인터페이스 |
| Backend | CSV 파싱, 파일·상태 관리, AI 서버 연결 | Spring Boot API와 컬럼 메타데이터 |
| AI Server | 컬럼 역할 태깅, 소스 경고 판단, 응답 검증 | FastAPI 기반 파일 분석 응답 |
| Storage | CSV 보관과 분석 상태 저장 | S3, PostgreSQL, Redis 기반 관리 |

## 분석 조건 JSON 예시

| Key | Value |
| --- | --- |
| analysis_type | ranking |
| metric_id | signup_conversion_rate |
| metric_formula | signup_complete / landing_sessions |
| date_field | signup_date |
| period_standard | this_week |
| period_compare | last_week |
| group_by | channel, device, user_type |
| filter | account_flag != internal_test |
| sort_by | delta_conversion_rate |

## 구현 핵심

| 기술 요소 | 구현 내용 | 사용자 가치 |
| --- | --- | --- |
| CSV Parser | 업로드한 CSV의 헤더, 샘플, 컬럼 통계를 추출 | 원본 파일을 분석 흐름에 연결 |
| OpenAI Parsing | 컬럼명·샘플·카탈로그를 기준으로 의미를 해석 | 컬럼명이 달라도 기준 후보를 찾음 |
| Pydantic Schema | AI 응답을 검증 가능한 형태로 고정 | 임의 응답과 누락을 줄임 |
| Semantic Role Tagging | 날짜, 지표, 차원, 상태 조건 후보를 태깅 | 분석 기준 확인을 쉽게 만듦 |
| Warning Handling | 기준 충돌과 데이터 상태 경고를 표시 | 애매한 기준을 임의로 넘기지 않음 |

---

# 4. MVP / 배포

## MVP 범위

MVP는 범위를 좁혀, 개인 실무자가 자주 반복하는 comparison과 ranking 질문에 집중합니다.

| MVP 범위 | 포함 여부 | 설명 |
| --- | --- | --- |
| Comparison | O | 기간 간 지표 비교 |
| Ranking | O | 그룹별 변화량 순위화 |
| CSV 업로드 | O | 별도 DB 연결 없이 분석 |
| 계산 기준 노출 | O | 지표·기준일·필터 표시 |
| 모호성 경고 | O | 애매한 조건 확인 요청 |
| 모든 자유 질의 | X | 초기 범위에서 제외 |
| 실시간 DB 연동 | X | 초기 범위에서 제외 |

## MVP 사용자 흐름

```mermaid
%%{init: {"theme": "base", "themeVariables": {"fontFamily": "Pretendard, Inter, sans-serif", "primaryColor": "#F8FAFC", "primaryBorderColor": "#334155", "lineColor": "#475569", "textColor": "#0F172A"}}}%%
flowchart LR
    A[질문 입력] --> B[CSV 업로드]
    B --> C[분석 기준 확인]
    C --> D[분석 실행]
    D --> E[결과 확인]
    E --> F[계산 기준 공유]

    classDef step fill:#F8FAFC,stroke:#334155,color:#0F172A,stroke-width:1.4px;
    classDef check fill:#ECFDF5,stroke:#059669,color:#064E3B,stroke-width:1.4px;
    class A,B,D,E step;
    class C,F check;
```

## 화면 단위 산출물

| 화면 | 주요 기능 |
| --- | --- |
| 질문 입력 화면 | 자연어 질문 입력 |
| CSV 업로드 화면 | 분석 파일 업로드 |
| 분석 기준 확인 화면 | 지표, 기준일, 비교 기간, 필터 확인 |
| 결과 화면 | 표, 차트, 변화량 확인 |
| 기준 설명 화면 | 계산식과 조건 확인 |

## 배포 구조

```mermaid
%%{init: {"theme": "base", "themeVariables": {"fontFamily": "Pretendard, Inter, sans-serif", "primaryColor": "#F8FAFC", "primaryBorderColor": "#334155", "lineColor": "#475569", "textColor": "#0F172A"}}}%%
flowchart TB
    User([User])
    Google["Google OAuth 2.0"]

    subgraph CICD["CI/CD Pipeline"]
        GH["GitHub Actions"]
        ECR[("AWS ECR<br/>Docker Image Registry")]
        GH -- "build & push" --> ECR
    end

    subgraph DNS["AWS Route53 · logue-ai.site"]
        R_FE["logue-ai.site"]
        R_BE["api.logue-ai.site"]
        R_AI["ai.logue-ai.site<br/>※ FE 직접 연동 확장성 고려"]
    end

    subgraph Vercel["Vercel"]
        FE["Frontend<br/>Next.js 16 · TypeScript · Tailwind"]
    end

    subgraph AWS["AWS"]
        subgraph ALB_BLOCK["Application Load Balancer"]
            ALB[["ALB"]]
            TG_BE["Target Group: Backend"]
            TG_AI["Target Group: AI"]
            ALB --> TG_BE
            ALB --> TG_AI
        end

        subgraph BE_INST["EC2 Instance"]
            BE["Backend Container<br/>Spring Boot 3.5 · Java 21<br/>+ Flyway Migration"]
        end

        subgraph AI_INST["EC2 Instance"]
            AI["AI Server Container<br/>FastAPI · Python 3.11 · uv<br/>Stateless"]
        end

        DB[("RDS PostgreSQL")]
        S3[("S3 Storage")]
        REDIS[("Redis")]

        TG_BE --> BE
        TG_AI --> AI
    end

    LLM["OpenAI API<br/>GPT-4o mini / nano"]

    User -- HTTPS --> R_FE
    R_FE --> FE

    FE -- "JWT 인증" --> R_BE
    R_BE --> ALB
    R_AI -.확장 대비.-> ALB

    BE -. "OAuth 검증" .-> Google
    BE -- "JWT 발급" --> FE

    BE -- "Internal API Key" --> R_AI

    BE -- "Schema Migration" --> DB
    BE --- S3
    BE --- REDIS

    AI -- "외부 LLM 호출" --> LLM

    ECR -. "image pull" .-> BE_INST
    ECR -. "image pull" .-> AI_INST

    classDef user fill:#F8FAFC,stroke:#334155,color:#0F172A,stroke-width:1.4px;
    classDef dns fill:#FEF3C7,stroke:#D97706,color:#78350F,stroke-width:1.4px;
    classDef fe fill:#EFF6FF,stroke:#2563EB,color:#1E3A8A,stroke-width:1.4px;
    classDef be fill:#F0FDF4,stroke:#16A34A,color:#14532D,stroke-width:1.4px;
    classDef ai fill:#FFF7ED,stroke:#EA580C,color:#7C2D12,stroke-width:1.4px;
    classDef store fill:#F5F3FF,stroke:#7C3AED,color:#4C1D95,stroke-width:1.4px;
    classDef alb fill:#FEE2E2,stroke:#DC2626,color:#7F1D1D,stroke-width:1.4px;
    classDef tg fill:#FECACA,stroke:#B91C1C,color:#7F1D1D,stroke-width:1.2px;
    classDef ext fill:#FCE7F3,stroke:#DB2777,color:#831843,stroke-width:1.4px;
    classDef cicd fill:#E0E7FF,stroke:#4338CA,color:#312E81,stroke-width:1.4px;
    classDef inst fill:#F1F5F9,stroke:#64748B,color:#0F172A,stroke-width:1.2px,stroke-dasharray: 4 3;

    class User user;
    class R_FE,R_BE,R_AI dns;
    class FE fe;
    class BE be;
    class AI ai;
    class DB,S3,REDIS store;
    class ALB alb;
    class TG_BE,TG_AI tg;
    class LLM,Google ext;
    class GH,ECR cicd;
```

## Tech Stack

| 구분 | Frontend | API Server | AI Server |
| --- | --- | --- | --- |
| Framework | Next.js 16 | Spring Boot 3.5 | FastAPI |
| Language | TypeScript | Java 21 | Python 3.11 |
| 주요 라이브러리 | Tailwind CSS | Flyway | Pydantic v2 · uv |
| Database | - | RDS PostgreSQL | Stateless (DB 미접근) |
| Cache / Storage | - | Redis · S3 | - |
| External API | - | Google OAuth 2.0 | OpenAI GPT-4o mini / nano |
| 인증 | JWT (BE 발급) | OAuth 2.0 직접 검증 · JWT 발급 | Internal API Key |
| 컨테이너 | - | Docker (AWS ECR) | Docker (AWS ECR) |
| Hosting | Vercel | EC2 + ALB | EC2 + ALB |
| DNS | `logue-ai.site` | `api.logue-ai.site` | `ai.logue-ai.site` |
| 환경 분리 | - | Staging / Production | - |
| CI/CD | Vercel | GitHub Actions | GitHub Actions |

## MVP 검증 기준

| 검증 항목 | 판단 기준 |
| --- | --- |
| 사용 가치 | comparison / ranking만으로도 쓸 이유가 있는가 |
| 시간 절감 | 엑셀 재가공 시간을 줄이는가 |
| 신뢰 확보 | 계산 기준 확인 부담을 줄이는가 |
| 공유 가능성 | 결과를 바로 설명 가능한 형태로 제공하는가 |

---

# 5. 차별성

## 비교 구간

| 비교 대상 | 강점 | 한계 | Logue의 차이 |
| --- | --- | --- | --- |
| BI 도구 | 정형 지표 조회 | 화면 밖 질문 대응 어려움 | 자연어 질문을 분석 조건으로 변환 |
| Excel | 자유로운 재가공 | 기준이 매번 흔들림 | 반복 질문을 구조화된 흐름으로 처리 |
| AI 챗봇 | 빠른 자연어 응답 | 계산 기준 신뢰 어려움 | 지표 정의와 계산 기준 노출 |
| NLQ 분석 서비스 | 자연어 질의 가능 | 모호성 검증 약함 | 기준일·필터·지표 충돌 감지 |

## 포지셔닝

| 축 | 기존 도구 | Logue |
| --- | --- | --- |
| 시작점 | 대시보드 메뉴, 데이터 테이블 | 실무자의 업무 질문 |
| 처리 단위 | 필터, 수식, 쿼리 | 분석 조건 JSON |
| 신뢰 방식 | 사용자가 직접 검증 | 계산 기준 자동 노출 |
| 핵심 사용자 | 분석가, 데이터 활용 숙련자 | 마케팅·기획·운영 실무자 |
| 초기 사용 사례 | 범용 분석 | comparison / ranking 반복 분석 |

## 차별화 요약

| 기존 방식 | Logue의 차별점 |
| --- | --- |
| ChatGPT는 CSV 질문에 답하지만, 분석 기준이 대화 안에 흩어진다 | 질문을 지표·기간·그룹·필터 조건으로 고정한다 |
| Excel은 자유롭게 계산할 수 있지만, 매번 수작업으로 기준을 다시 잡아야 한다 | 한 번 만든 분석 기준을 다음 CSV에도 반복 적용한다 |
| BI는 정해진 대시보드 안에서 강하지만, 대시보드 밖 질문은 처리하기 어렵다 | 개인 실무자의 자연어 질문을 CSV 기반 분석 조건으로 바꾼다 |
| 자동 리포트는 결과 중심으로 보여주지만, 계산 기준 확인이 어렵다 | 결과와 함께 계산식, 기준일, 비교 기간, 필터를 함께 보여준다 |
| 기존 방식은 모호한 기준을 사용자가 뒤늦게 검증해야 한다 | 모호한 기준은 계산 전에 경고하고 확인시킨다 |

---

# 6. 산학트랙 PMF / 고객 인터뷰

## PMF 검증 방향

| 검증 목표 | 확인할 내용 |
| --- | --- |
| 문제 반복성 | 동일한 분석·보고 문제가 반복되는가 |
| 현재 대안 | BI, Excel, 데이터팀 요청 중 무엇을 쓰는가 |
| 병목 지점 | 데이터 확인, 기준 정리, 결과 설명 중 어디가 어려운가 |
| MVP 적합성 | comparison / ranking만으로도 가치가 있는가 |
| 사용 의향 | 실제 업무 시간을 줄일 수 있다고 느끼는가 |

## 인터뷰 대상

| 대상 | 확인 목적 |
| --- | --- |
| 마케팅 실무자 | 전환율·채널 성과 분석 과정 확인 |
| 기획/운영 실무자 | 지표 변화 원인 파악 과정 확인 |
| 데이터 협업 경험자 | 데이터팀 요청 전후의 병목 확인 |

## 인터뷰 질문지

| 검증 항목 | 질문 |
| --- | --- |
| 문제 빈도 | 최근 2주 안에 수치를 직접 분석하거나 설명한 적이 있는가 |
| 현재 해결 방식 | 대시보드, 엑셀, 데이터팀 요청 중 무엇을 사용하는가 |
| 병목 지점 | 가장 오래 걸리는 단계는 무엇인가 |
| 신뢰 문제 | 결과 공유 전 계산 기준을 다시 확인하는가 |
| 대체 가능성 | Logue가 기준 구조화를 해준다면 기존 방식보다 나은가 |

## 인터뷰 결과 정리 양식

| 인터뷰 대상 | 확인된 Pain Point | 현재 대안 | Logue 적합성 |
| --- | --- | --- | --- |
| 마케팅 실무자 | 예: 채널별 전환율 하락 원인을 엑셀로 재가공 | BI + Excel | 높음 |
| 기획/운영 실무자 | 예: 기준일과 필터 조건을 매번 다시 확인 | 대시보드 + 수작업 | 중간~높음 |
| 데이터 협업 경험자 | 예: 데이터팀 요청 전 질문 정리가 어려움 | 슬랙/문서 요청 | 높음 |

## PMF 판단 기준

| 기준 | 통과 조건 |
| --- | --- |
| 문제 반복성 | 2~3명 중 2명 이상이 유사 문제를 반복 경험 |
| 기존 방식 불편함 | Excel/BI/데이터팀 요청에서 명확한 병목 확인 |
| MVP 적합성 | comparison / ranking 질문만으로도 사용 가치 확인 |
| 신뢰 필요성 | 계산 기준 확인 니즈가 반복적으로 등장 |
| 사용 의향 | 실제 업무 시간 절감 기대가 확인됨 |

## 작성 주의

| 주의사항 |
| --- |
| 실제 인터뷰 전에는 결과처럼 쓰지 않습니다 |
| 위 표는 인터뷰 설계 및 기록 양식입니다 |
| 발표 전 실제 응답 기반으로 Pain Point와 적합성을 업데이트합니다 |

---

# One-liner

| Logue |
| --- |
| 데이터 전문 인력이 아닌 실무자의 자연어 질문을 분석 가능한 조건으로 구조화하고, CSV 기반 분석 결과와 계산 기준을 함께 제공하는 Question-first 분석 지원 서비스 |
