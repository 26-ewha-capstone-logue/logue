# Logue 심층 인터뷰

## 1️⃣ 팀 RnR

### 1. 기본 RnR ❤️

| 구분 | 업무 | 담당자 |
| --- | --- | --- |
| 기획 | 상위 기획, 와이어프레임 작업, 기능명세서 작업, PPT 작업 | 손하늘 |
| 디자인 | 브랜딩, GUI, UX 라이팅, UI/UX 디자인 | 외부 인력, 손하늘 |
| FE | 화면 구현, 사용자 인터랙션 처리, API 연동, 상태 관리, 테스트용 콘솔/데모 UI 구현 | 김예원 |
| BE | API 설계 및 구현, 데이터 처리 및 저장 구조 설계, 서버 로직 관리, 인증 및 요청 처리 | 김겨레, 민지인 |
| AI | LLM 프롬프트 설계, 라벨링/분석 로직 구현, 모델 호출 및 결과 구조화, 토큰 최적화 및 성능 개선 | 손하늘, 김예원 |

### 2. 심층 인터뷰 준비 RnR ❤️

| 구분  | 업무 | 담당자 |
| --- | --- | --- |
| 설계 | 테스트 시나리오 및 구조 결정, 확장 기능 논의 및 구현 | 손하늘, 김겨레, 김예원, 민지인 |
| 데모 개발 구조화 | 시연용 AI 로직 구체화 | 손하늘, 김겨레, 민지인 |
| 데모 개발 | 시연용 AI 로직 및 UI 개발 | 손하늘 |
| 데모 토큰 효율화 | 시연용 AI 로직 효율화 | 김예원 |
| 문서화 및 확장 | 각 파트 진행 사항 작성 및 MVP 기능 구현 | 손하늘, 김겨레, 김예원, 민지인 |
| 데모 시연 | 시연 진행, 테스트 설계 방안 설명 | 손하늘 |
| 코드 및 효율화 설명 | 코드 설명 및 토큰 사용 효율화 설명 | 김예원 |

## 2️⃣ 서비스 개요

> 한 줄 정리
> 

<aside>

- **문제 인식** 💛
    1. 상황 분석
        - ㅇ
        - ㅇ
        - ㅇ
    2. 기업 분석
        - ㅇ
        - ㅇ
        - ㅇ
    3. 소비자 분석
        - ㅇ
        - ㅇ
        - ㅇ
- **솔루션 (기획)** 💛
    
    > **타겟** :
    > 
    - 비즈니스 로직
        1. ㅇㅇ
        2. ㅇ
        3. ㅇ
        4. ㅇ
    - BM :
    - GTM 전략 :
- **솔루션 (기술)** ❤️
    - **FE**
    - **⭐ BE**
        
        서비스를 지향하는 산학트랙의 경우, API Call을 통해 어떤 AI 서비스를, 어떤 목적으로, 어떤 파라미터를 주고, 그 결과를 어떻게 활용하는지 간단히 정리(어떻든 AI를 적극적으로 적용해보세요)
        
    - **⭐ AI**
        - 서비스를 지향하는 산학트랙의 경우, API Call을 통해 어떤 AI 서비스를, 어떤 목적으로, 어떤 파라미터를 주고, 그 결과를 어떻게 활용하는지 간단히 정리(어떻든 AI를 적극적으로 적용해보세요)
        - AI 투명성 리포트
- **확장 전략** 💛
    1. 타겟 확장 : 
    2. 기술 솔루션 확장 : 
</aside>

<aside>

> **교수님 면담 결과** 💛
**→** 비교 대상을 **Julia AI 같은 단일 서비스로 고정**해 그 서비스가 **반복적으로 놓치는 질문 시나리오를 먼저 확보하**고, 전범위 구현 대신 **핵심 로직과 시연 UI에 집중하되, 연동 실패에 대비해 스태틱 대체 플랜까지 준비**하는 것이 데모 성공 확률을 가장 높인다.
> 

| 피드백 항목 | 교수님 코멘트 | 시사점 |
| --- | --- | --- |
| 비교 대상 명확 | 기존BI, ChatGPT, 내부 데이터팀등 여러 비교축을 동시에 잡지 말고 Julia AI 같은 단일 서비스로 명확히 좁힐 것 | 경쟁 구도가 흐리면 데모 메시지가 약해진다. 한 서비스의 실패 지점을 먼저 고정해야 차별점이 선명해진다 |
| 실패 케이스 선확보 | 경쟁 서비스가 반복적으로 해결하지 못하는 질문·상황을 먼저 확보하고, 같은 시나리오에서 우리 서비스가 되는 것을 보여줄것 | 개발 전에 비교 기준이 없으면 ‘이미 남들도 되는 기능’을 뒤늦게 구현할 위험이 크다. |
| MVP 범위 축 | FE, API, AI, 액션 엔진을 모두 완성하려 하기보다 인프라는 최대한 기존 도구를 활용하고 핵심 로직과 UI에 집중할 것. | 프로젝트 성패는 전범위 구현이
 아니라 핵심 기능을 끝까지 보여주는 데 달려있다.
 |
| Plan B/C 준비 | 시스템 연결이 불안정하면 차트나일부 결과는 스태틱·임의 데이터로 대체하는 플랜을 미리 준비할 것 | 최종데모는 완전성보다 실패하지 않는 시연 구조가 더 중요하다 |
</aside>

## 3️⃣ 테스트 설계 💛

<aside>

### 1) 기술적으로 challenging한 부분

| 구분 | WHY |
| --- | --- |
| 질문 해석 | 같은 질문도 사람마다 의미가 다르고, CSV마다 대응되는 컬럼이 다름 |
| 스키마 불확실성 | DB처럼 고정된 schema가 없어서 파일마다 컬럼명, 값 체계, 날짜 기준이 다름 |
| metric grounding | “가입 전환율” 같은 비즈니스 지표를 어떤 컬럼 조합으로 계산할지 안정적으로 잡아야 함 |
| ambiguity handling | `signup_date`와 `created_at` 중 어떤 날짜를 쓸지 같은 모호성을 감지하고 수정 가능하게 해야 함 |
| consistency | 같은 질문에 매번 다른 기준으로 답하면 제품이 아니라 데모로 밖에 못 씀 |
</aside>

<aside>

### 2) 실험한 부분

- **0. 전제**
    - 백엔드 API X
    - OpenAI API를 직접 호출하는 로컬 스크립트만 구현
    - 스크립트는 콘솔 출력 + 결과 JSON 파일 저장
    - FE는 그 저장된 JSON을 읽어서 테스트셋/케이스/결과를 보여주는 정적 페이지
    
    → AI 실행은 콘솔, 시연은 FE로 분리
    
- **1. 테스트 케이스 선정**
    
    > 타겟 소비자가 많이 하는 질문 중 하나인 **비교·순위형** 형태의 질문을 중심으로, **표현 변화·스키마 차이·모호성 상황**에서도 분석 기준이 **일관되게 도출**되는지 검증했다.
    > 
    
</aside>

<aside>

### 3) 테스트 설계

> 성격이 다른 data set 3개를 통해 주요 해석 지표인 `비교`와 `순위` 질문 두 개에 대해 제대로 된 값을 출력하는지 확인한다.
> 
- **1. 검증 여부**
    
    
    | 검증 대상 | 테스트 포함 여부 | 이유 |
    | --- | --- | --- |
    | `analysis_type` 도출 | ⭕ | **comparison / ranking**을 주요 해석 지표로 지정함. |
    | `metric_id` 도출 | ⭕ | 질문의 중심 지표를 잘못 잡으면 전부 무너짐 |
    | `date_field` 도출 | ⭕ | 기준일 충돌은 핵심 리스크 |
    | `period_standard`, `period_compare` 도출 | ⭕ | 비교 질문 핵심 |
    | `group_by` 도출 | ⭕ | “어디에서”를 못 잡으면 차별점이 사라짐 |
    | `sort_by`, `sort_direction` 도출 | ⭕ | ranking/comparison 차이가 여기서 드러남 |
    | `limit` 도출 | ⭕ | top n 질문 핵심 |
    | `filters` 도출 | ⭕ | `internal_test 제외` 같은 조건 반영 필요 |
    | 차트/표 렌더링 | ❌ | 지금 검증 본체 아님 |
    | 인사이트 문장 생성 | ❌ | 일주일 안에 손대면 범위 터짐 |
    | 자유형 모든 질문 | ❌ | comparison / ranking만 집중 |
- **2. 테스트 케이스**
    
    
    | 테스트 layer | WHAT | example | TC |
    | --- | --- | --- | --- |
    | 1. 정상 케이스 | 명확한 질문을 제대로 구조화하는지 | “이번 주 전환율 top 5” | TC-01 ~ TC-03, TC-07 ~ TC-08 (조건 추가) |
    | 2. 표현 다양화 | 같은 의도를 다양한 표현으로 넣어도 같은 기준이 나오는지 | “가장 낮은”, “하위 5개”, “top 5 낮은 순” | TC-04 ~ TC-06 |
    | 3. 스키마 변화 | 컬럼명이 달라져도 같은 역할로 매핑하는지 | `signup_complete` vs `signups` | TC-09 ~ TC-10 |
    | 4. 실패/모호성 처리 | 모호하면 경고/수정 유도하는지 | `signup_date` vs `created_at` | TC-11 ~ TC-12 |
- **3. 테스트 데이터 셋**
    
    
    | 구분 | 용도 | 필드 |
    | --- | --- | --- |
    | Dataset A: 명확한 마케팅 퍼널형 | 정상 케이스 | • `signup_date`
    • `landing_sessions`
    • `signup_complete`
    • `channel`
    • `device_type`
    • `internal_test` |
    | Dataset B: 같은 의미, 다른 컬럼명 | 매핑/표현 다양화 | • `created_at`
    • `visits`
    • `signups`
    • `source`
    • `device`
    • `is_test` |
    | Dataset C: 모호한 데이터셋 | 기준일 충돌, ambiguity 처리 | `signup_date
    created_at
    landing_sessions
    signup_complete
    channel
    device_type
    internal_test` |
- **4. golden set (기댓값)**
    
    
    | 구분 | `analysis_type` | `metric_id` | `date_field` | `group_by` | `sort_by` | `limit` |
    | --- | --- | --- | --- | --- | --- | --- |
    | 이번 주 가입 전환율이 가장 낮은 채널·디바이스 top 5를 보여줘 | `ranking` | `conversion_rate` | `signup_date` | `["channel","device_type"]` | `conversion_rate` | 5 |
    | 이번 주 가입 전환율이 지난주 대비 어디에서 가장 많이 떨어졌어? | `comparison` | `conversion_rate` | `signup_date` | `["channel","device_type"]` | `delta_conversion_rate` | - |
- **5. 평가 기준**
    
    
    | 필드 | 배점 | 이유 | hard fail |
    | --- | --- | --- | --- |
    | `analysis_type` | 15 | ranking/comparison 틀리면 치명적 | ✅ |
    | `metric_id` | 20 | 지표 틀리면 결과 자체가 무의미 | ✅ |
    | `date_field` | 15 | 기준일 충돌 핵심 | ✅ |
    | `period_standard` | 10 | 기간 해석 중요 | ❌ |
    | `period_compare` | 10 | comparison 핵심 | ❌ |
    | `group_by` | 15 | “어디에서”를 못 잡으면 핵심 실패 | ❌ |
    | `sort_by` | 10 | ranking/comparison 차이 핵심 | ❌ |
    | `sort_direction` | 5 | asc/desc는 중요하지만 상대적으로 단순 | ❌ |
    | `limit` | 5 | ranking에서 중요 | ❌ |
    | `filters` | 5 | 조건 반영 확인 | ❌ |
- **6. 결과 기준**
    
    
    | 지표 | 의미 |
    | --- | --- |
    | Exact Match Rate | 모든 핵심 필드가 정답과 동일한 비율 |
    | Field Accuracy | 각 필드별 정확도 |
    | Hard-Fail Rate | `analysis_type/metric_id/date_field` 오답 비율 |
    | Ambiguity Detection Rate | 모호한 케이스에서 경고를 띄운 비율 |
    | Unsupported Rejection Accuracy | 지원 불가 질문을 거절한 정확도 |
    
    > 예시
    > 
    > - 전체 exact match: 68%
    > - `analysis_type` 정확도: 95%
    > - `metric_id` 정확도: 90%
    > - `date_field` 정확도: 72%
    > - ambiguity detection: 80%
- **7. 테스트 시나리오**
    
    ### 🅰️ 구분
    
    <aside>
    
    > **A. 같은 의도, 다른 표현**
    > 
    - 질문이 달라도 기준이 같아야 함. 세 질문 모두 같은 `AnalysisCriteria`가 나와야 한다.
    - 질문
        - 이번 주 가입 전환율이 가장 낮은 채널·디바이스 top 5를 보여줘
        - 이번 주 전환율 하위 5개 채널·디바이스 조합 보여줘
        - 이번 주 채널·디바이스별 가입 전환율 낮은 순 5개 보여줘
    </aside>
    
    <aside>
    
    > **B. 같은 질문, 다른 스키마**
    > 
    
    Dataset A와 B에서 같은 의도일 때 같은 의미 구조가 나와야 한다.
    
    결과는 내부 매핑만 달라지고, `metric_id = conversion_rate`는 같아야 한다.
    
    - A: `signup_complete`, `landing_sessions`
    - B: `signups`, `visits`
    </aside>
    
    <aside>
    
    > **C. 모호성 감지**
    > 
    
    Dataset C처럼 `signup_date`, `created_at` 둘 다 있으면 무조건 한쪽으로 밀어붙이지 말고 warning이나 candidate를 내야 함. → 왜냐하면 “AI가 모르면 모른다고 말하게 만드는 설계”가 challenge
    
    </aside>
    
    ### 🅱️ 구성
    
    dataset-a = `A` 로 표기
    
    | TC | Dataset | 질문 유형 | 테스트 layer | 질문 구조 | 검증하려는 포인트 |
    | --- | --- | --- | --- | --- | --- |
    | TC-01 | A | `ranking` | 1. 정상 케이스 | 가장 기본형 ranking 질문.
    
    “이번 주 + 가입 전환율 + 채널·디바이스 + top 5” | `analysis_type=ranking`, `metric_id=conversion_rate`, `group_by=channel/device`, `limit=5`, `sort_by=conversion_rate`가 제대로 나오는지 |
    | TC-02 | A | `ranking` | 2. 표현 다양화 | TC-01과 같은 의도지만 표현 변경
    
    “채널·디바이스별”, “낮은 순 5개” | 같은 의미의 paraphrase를 넣어도 동일한 기준으로 구조화되는지 |
    | TC-03 | A | `ranking` | 2. 표현 다양화 | TC-01과 같은 의도지만 표현 변경
    
    “하위 5개 채널·디바이스 조합” | “top 5”가 없어도 하위/낮은 순 표현을 ranking으로 해석하는지 |
    | TC-04 | A | `comparison` | 1. 정상 케이스 | 가장 기본형 comparison 질문. 
    
    “이번 주 vs 지난주 대비”와 “가장 많이 떨어졌어?” | `analysis_type=comparison`, `period_standard=this_week`, `period_compare=last_week`, `sort_by=delta_conversion_rate`가 맞는지 |
    | TC-05 | A | `comparison` | 2. 표현 다양화 | 가장 기본형 comparison 질문, 표현 변경
    
    “지난주와 비교”, “가장 많이 하락” | 비교 질문을 다른 표현으로 넣어도 동일한 comparison 기준이 나오는지 |
    | TC-06 | A | `comparison` | 2. 표현 다양화 | 가장 기본형 comparison 질문, 뭉뚱그린 표현으로
    
    “전주 대비 크게 떨어진 구간” | 명시적 “어디에서” 없이도 하락 비교 의도를 comparison으로 잡는지 |
    | TC-07 | A | `ranking` | 1 + 조건 추가 | TC-01에 `internal_test 제외` 조건을 추가 | ranking 기본 해석은 유지하면서 `filters`가 정확히 추가되는지 |
    | TC-08 | A | `comparison` | 1 + 조건 추가 | TC-04에 `internal_test 제외` 조건을 추가 | comparison 기본 해석은 유지하면서 `filters`가 정확히 추가되는지 |
    | TC-09 | B | `ranking` | 3. 스키마 변화 | dataset-a와 동일 의도 질문을 컬럼명이 다른 dataset-b에 적용 | `channel→source`, `device_type→device`, `landing_sessions→visits`, `signup_complete→signups`처럼 스키마가 달라도 같은 의미로 매핑되는지 |
    | TC-10 | B | `comparison` | 3. 스키마 변화 | TC-04와 동일 의도 질문을 dataset-b에 적용 | 비교형 질문에서도 스키마 차이를 견디고 올바른 `metric/date/group_by`를 매핑하는지 |
    | TC-11 | C | `ranking` | 4. 실패/모호성 처리 | ranking 질문 자체는 단순하지만, dataset-c에 날짜 후보가 2개(`signup_date`, `created_at`) | 질문 해석 자체는 ranking으로 맞추되, `date_field` 모호성을 감지하고 warning/수정 유도를 할 수 있는지 |
    | TC-12 | C | `comparison` | 4. 실패/모호성 처리 | “신규/기존 유저별” 축을 요구하지만 dataset-a에는 해당 구분 컬럼이 없음 | 없는 축을 억지 추론하지 않고 `unsupported_reason` 또는 질문-데이터 불일치로 처리하는지 |
- **8.** 💜 **기반 소프트웨어 / 기술 플로우 개요**
    
    ### 기반 소프트웨어 구성
    
    본 테스트는 백엔드 API 서버를 중심으로 동작하는 구조가 아니라, React 기반 정적 프론트엔드와 로컬 Node.js 실행 스크립트를 분리해 둔 구조다.
    
    - FE
        - 스택 : Vite + React + TypeScript (화면에서 데이터셋 설명, 테스트 케이스, 저장된 실행 결과를 시연용으로 보여주는 역할만 담당)
        - OpenAI를 직접 호출하지 않고, 미리 준비된 fixture JSON과 실행 후 저장된 결과 파일을 읽어 화면에 표시한다.
    - AI
        - 역할 : `tsx`로 실행되는 로컬 TypeScript 스크립트. `OPENAI_API_KEY`와 `OPENAI_MODEL` 값을 읽고, OpenAI SDK를 통해 테스트 케이스별로 모델을 호출한다.
        - 호출 대상 : 질문을 `AnalysisCriteria` 형태의 JSON으로 변환하며 → 스크립트 내부에서 프롬프트를 구성 → 응답 정규화한 뒤 → 기대값과 비교해 → 케이스별 성공/실패를 집계한다.
        - 이 흐름은 로컬 터미널에서 수행되며, 별도의 중간 API 서버나 데이터베이스 계층은 없다.
    - 입력 데이터와 산출물
        - 파일로 관리
            - fixtures : metric preset, 데이터셋 정의, 테스트 케이스가 JSON으로 고정 저장
            - 로컬 실행 스크립트 : 이 파일들을 읽어 테스트 입력으로 사용
            - 실행 결과 : latest-results.json과 latest-console.txt로 저장 후 결과 파일은 다시 프론트엔드가 읽어 시연 화면에서 표시한다.
    
    | 구분 | 사용 기술/소프트웨어 | 역할 |
    | --- | --- | --- |
    | 프론트엔드 | React 19, Vite 6, TypeScript | 데이터셋/테스트 케이스/저장 결과를 정적으로 보여주는 시연 화면을 제공한다. |
    | 로컬 실행 환경 | Node.js, tsx | TypeScript 스크립트를 로컬에서 직접 실행해 AI 테스트를 수행한다. |
    | AI 호출 | OpenAI SDK, .env | 로컬 스크립트가 OpenAI 모델을 직접 호출하고 모델명 및 API 키를 환경변수로 주입받는다. |
    | 입력 데이터 관리 | `fixtures/*.json` | metric preset, dataset schema, test case를 고정된 테스트 입력으로 제공한다. |
    | 결과 저장 | `public/results/*.json`, `public/results/*.txt` | 비교 결과 요약과 콘솔 로그를 파일로 저장하고, 프론트가 이를 다시 읽는다. |
    | 동시 실행 보조 | `concurrently` | `npm run demo`에서 Vite 개발 서버와 AI 테스트 스크립트를 함께 실행한다. |
    
    ### 기술 플로우 개요
    
    1. 먼저 테스트 입력이 파일로 준비된다.
        
        metrics.json에는 현재 사용 지표가 정의되어 있고, datasets에는 데이터셋 스키마와 예시 row가 저장되어 있으며, test-cases.json에는 질문과 기대 `AnalysisCriteria` 일부 값이 저장된다. 프론트엔드와 로컬 실행 스크립트는 이 같은 fixture를 공통 기준으로 사용한다.
        
    2. 사용자가 로컬에서 AI 테스트를 실행한다.
        
        기본 실행은 `npm run ai:test`이며, 시연용으로는 `npm run demo`를 사용해 Vite 개발 서버와 AI 테스트 스크립트를 함께 실행할 수 있다. 이때 실제 AI 호출은 브라우저가 아니라 로컬 Node.js 스크립트에서 수행된다.
        
    3. 로컬 스크립트가 환경변수와 fixture를 읽는다.
        
        스크립트는 .env에서 `OPENAI_API_KEY`와 선택적 모델명을 읽고, test-cases.json, metrics.json, dataset-a.json, dataset-b.json, dataset-c.json을 로드한다. API 키가 없으면 실행을 중단하고, 그 상태 자체를 결과 파일로 남긴다.
        
    4. 각 테스트 케이스마다 질문이 OpenAI 호출 입력으로 변환된다.
        
        스크립트는 데이터셋 스키마, metric preset, 질문, 필수 출력 형식을 묶어 프롬프트를 만들고, OpenAI SDK의 chat completion을 호출한다. 이 호출은 각 테스트 케이스 단위로 반복되며, 모델 응답은 JSON 객체 형태만 허용된다.
        
    5. 모델 응답이 `AnalysisCriteria` 표준 형태로 정규화된다.
        
        응답 JSON은 `analysis_type`, `metric_id`, `date_field`, `group_by`, `filters`, `unsupported_reason` 같은 필드로 정리된다. 이 과정에서 기간 표현 정규화, 배열/필터 형태 정리, 일부 데모용 후처리 규칙 적용이 함께 수행된다.
        
    6. 정규화된 결과와 기대값이 비교된다.
        
        각 테스트 케이스에는 전체 정답이 아니라 “기대 partial criteria”가 들어 있으므로, 스크립트는 해당 필드들만 비교한다. 일치 필드와 불일치 필드를 분리하고, 케이스별 성공/실패를 판정한다. API 오류나 JSON 파싱 실패가 발생해도 전체 실행을 중단하지 않고 해당 케이스를 실패로 기록한 뒤 다음 케이스로 진행한다.
        
    7. 집계 결과와 실행 로그가 파일로 저장된다.
        
        전체 실행이 끝나면 요약 정보, 케이스별 비교 결과, 필드별 정확도가 latest-results.json에 저장된다. 사람이 읽기 쉬운 텍스트 로그는 latest-console.txt에 저장된다. 이 저장 단계가 로컬 AI 실행부와 프론트엔드 사이의 연결 지점이다.
        
    8. 프론트엔드가 저장된 결과 파일을 읽어 시연 화면에 표시한다.
        
        브라우저 화면은 fixture를 정적으로 import해 데이터셋과 테스트 케이스를 표시하고, results 아래 결과 파일은 fetch로 읽는다. 따라서 화면에서 보는 PASS/FAIL, actual criteria, field accuracy, 콘솔 로그 미리보기는 브라우저가 실시간으로 OpenAI를 호출한 결과가 아니라, 로컬 스크립트가 미리 저장한 파일을 다시 읽어 보여준 것이다.
        
    
    정리하면, 이 프로젝트의 데이터 흐름은 다음과 같다.
    
    입력 fixture JSON → 로컬 AI 실행 스크립트 → OpenAI 호출 → `AnalysisCriteria` 생성 및 비교 → 결과 JSON/텍스트 저장 → 정적 프론트엔드 표시
    
    ### 메모
    
    - OpenAI 호출 시 응답 형식을 `json_object`로 제한하는 구현이 있다. 본문에서는 전체 흐름 설명이 목적이어서, 호출 옵션 수준의 세부 설정은 제외했다.
    - 스크립트 내부에 기간 표현 정규화와 데모용 후처리 규칙이 있다. 본문은 시스템 경로 설명에 집중하기 위해, 개별 휴리스틱 규칙 목록은 넣지 않았다.
    - 현재 metric preset은 사실상 `conversion_rate` 1개만 사용한다. 본문에서는 구조 설명이 우선이므로, 지표 확장 범위 대신 “fixture 기반 preset 사용”만 반영했다.
    - 결과 파일을 읽을 때 프론트엔드는 결과 JSON이 없거나 비어 있는 경우를 별도로 처리한다. 이는 UI 예외 처리 세부사항이라 본문에서는 제외했다.
    - `npm run demo`는 개발 서버와 AI 테스트를 동시에 띄우는 편의 스크립트다. 본문에서는 전체 실행 순서에 필요한 수준만 포함하고, 명령 구성 방식 자체는 생략했다.
</aside>

## 4️⃣ 테스트 결과 & 시사점 💜

- 팀이 수정/변경 등 한 부분이 있다면 무얼 했고,
- 이것으로 무얼 했고,
- 입력은 무엇이고,
- 출력은 무엇인데,
- 실험결과에 대한 자체 평가는 무엇이고(우리의 문제해결에 작 적용될것 같은 정도)
- 이 실험은 기말에 무엇으로 쓰일것이다
- AI 투명성 리포트
    
    

## 5️⃣ 확장 기능 (데모데이용) ❤️
