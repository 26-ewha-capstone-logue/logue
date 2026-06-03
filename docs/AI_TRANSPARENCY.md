---
title: Logue AI 투명성 리포트 (AI Transparency Report)
team: 19팀 Logue
advisor: 컴퓨터공학과 하진용 교수님
repo: https://github.com/26-ewha-capstone-logue/logue
last_updated: 2026-06-03
scope: 이 문서는 "제품에 내장된 AI"와 "개발 과정에서 협업 도구로 쓴 AI"를 구분해 기록한다.
principle: AI는 팀원이되 최종 판단·책임은 사람에게 있다 (human-in-the-loop).
---

# AI 투명성 리포트

## 0. TL;DR
- **제품 내 AI**: OpenAI `gpt-4.1-nano / mini`로 (1) 파일 컬럼 의미 분류, (2) 질문→분석기준 구조화,
  (3) 결과 한 줄 요약만 수행. 수치 계산·집계는 전부 백엔드가 담당하고, AI 출력은 Pydantic 스키마 +
  비즈니스 룰로 재검증한 뒤에만 사용자에게 노출.
- **개발 보조 AI**: CodeRabbit(PR 리뷰), LiteLLM/Claude(리팩토링 스캐너), Codex·Claude Code/OMC(코드·스킬·문서 초안),
  ChatGPT/Claude 채팅(기획·리서치)을 사용. 단, 전부 **권고/초안 생성**까지이고 채택·머지 결정은 사람이 했다.
- **핵심 원칙**: AI 제안은 기본적으로 "초안"이며, 수용·수정·기각 이력이 PR/커밋/이슈에 남아 있다.

---

## 1. 사용한 AI 도구 인벤토리

| 도구 | 사용 단계 | 무엇에 썼나 | 통제 장치 (사람이 한 것) | 증거 |
|------|----------|-------------|--------------------------|------|
| **OpenAI gpt-4.1-nano/mini** | 제품 런타임 | 컬럼 분류 / 질문 구조화 / 결과 요약 | 원본 데이터 미전달(컬럼 메타만), Structured Outputs 강제, 룰 재검증, eval 게이트 | [`apps/ai/prompts/`](https://github.com/26-ewha-capstone-logue/logue/tree/main/apps/ai/prompts), [`apps/ai/rules/`](https://github.com/26-ewha-capstone-logue/logue/tree/main/apps/ai/rules), [`apps/ai/eval/`](https://github.com/26-ewha-capstone-logue/logue/tree/main/apps/ai/eval) |
| **CodeRabbit** | PR 리뷰 | dev-base PR 자동 코드리뷰(FE/BE/AI 경로별 지침) | 라벨 게이팅 + `request_changes_workflow: false`(머지 차단 안 함) → 수용 여부 사람 결정 | [.coderabbit.yaml](https://github.com/26-ewha-capstone-logue/logue/blob/main/.coderabbit.yaml), [coderabbit-auto-review.yml](https://github.com/26-ewha-capstone-logue/logue/blob/main/.github/workflows/coderabbit-auto-review.yml) |
| **CodeRabbit Chat** | 리뷰 대응 | 요청한 수정사항을 직접 코드로 구현 | **별도 브랜치로 받아 사람이 리뷰 후 반영** | 커밋 [`8c161e7`](https://github.com/26-ewha-capstone-logue/logue/commit/8c161e7) (`llm_output_validator.py` +37, 테스트 +138), 브랜치 `coderabbitai/chat/462f1c7` |
| **LiteLLM (Claude)** | 리팩토링 스캔 | dev push 시 변경량 임계치 초과하면 구조 스캔→리팩토링 백로그 이슈 자동 생성 | 임계치(FE20/BE15/AI10)·dry_run·force·part 옵션으로 발사 조건 통제, 생성된 이슈는 사람이 취사선택 | [refactor-scan.yml](https://github.com/26-ewha-capstone-logue/logue/blob/main/.github/workflows/refactor-scan.yml) |
| **Codex** | 코드/스킬 작성 | 리뷰 코멘트 대응, 리팩토링 백로그 스킬·"CodeRabbit식 diff 리뷰" 스킬 작성 | 커밋 단위로 사람이 리뷰 후 머지 | 커밋 `00eec81`, `9b6593f`, `7347dd0` (author: Codex) |
| **Claude Code / OMC** | 개발 보조 | 코드·문서 초안 작성 보조 | 초안으로만 사용하고, **커밋 전 사람이 검토**한 뒤 반영 | 레포 내 `.claude/`, `.omc/` |
| **ChatGPT / Claude (채팅)** | 기획·리서치 | 시장조사·문제정의·자료 정리 등 기획·리서치 단계 보조 | 출처 교차검증·사실확인은 사람이 수행 | 발표 출처 16건(슬라이드 84p) |

---

## 2. AI vs 사람 책임 경계 (가장 중요)

### 제품(런타임)에서
| 일은 누가 | 내용 |
|-----------|------|
| **AI가 한다** | 자연어 질문의 의도 파싱, 컬럼의 semantic role 추론, 결과를 사람이 읽을 한 줄로 표현 |
| **AI가 절대 안 한다** | 실제 수치 계산·집계(전부 BE), 근거 없는 숫자 생성(프롬프트로 금지), 원본 데이터 열람(컬럼 메타만 전달) |
| **사람이 만든 안전장치** | Structured Outputs로 자유응답 차단 → Pydantic 검증 → catalog/column 참조 무결성 검증 → 위반 시 `502 LLM_OUTPUT_INVALID`로 차단, 모호하면 경고+사용자 확인 흐름 |

> 근거: 발표 24·25·79~82p, `apps/ai/services/llm_output_validator.py`, `apps/ai/rules/`

### 개발 과정에서
| 일은 누가 | 내용 |
|-----------|------|
| **AI가 한다** | PR 리뷰 코멘트 초안, 리팩토링 후보 탐지, 코드·테스트·문서 초안 생성 |
| **사람이 한다** | 아키텍처·도메인 모델 설계, 수용/기각 결정, 머지, 최종 품질 책임 |

---

## 3. "복붙이 아니다" — 비판적 판단의 흔적

> 평가 기준 대응: *AI 출력을 그대로 썼는가, 비판적으로 취사선택했는가?*

1. **리뷰를 권고형으로 설정** — `.coderabbit.yaml`의 `request_changes_workflow: false`.
   CodeRabbit은 PR을 막을 권한이 없고, 코멘트 수용 여부는 리뷰어가 판단했다.
2. **무차별 리뷰를 막는 라벨 게이팅** — `coderabbit-review` 라벨 + dev-base 한정.
   모든 PR을 기계적으로 리뷰하지 않고, 통합 브랜치로 가는 PR에만 선택 적용했다.
3. **노이즈 억제 판단** — `path_filters`로 lock/build/`.next`/`node_modules`/asset 제외,
   경로별 리뷰 지침을 직접 작성(FE: 컴포넌트 재사용·TanStack Query / BE: JPA 성능·OAuth2·Flyway 안전성 / AI: Pydantic·async).
4. **AI 구현분도 사람이 검수** — CodeRabbit Chat이 만든 코드는 `coderabbitai/chat/*` 별도 브랜치(`8c161e7`)로 들어왔고,
   바로 main이 아니라 리뷰 후 반영했다.
5. **리뷰 코멘트 선별 반영** — 커밋 `7347dd0 fix: address onboarding review comments`처럼
   지적 중 타당한 것만 반영한 이력이 남아 있다.
6. **실제 수용/스킵 사례 (PR #242)** — `prompt_loader` PR에서 CodeRabbit이 여러 개선을 제안했을 때,
   팀은 `clear_cache()`만 수용해 수정하고 나머지는 *"마이너 + 후속 리팩토링/문서 작업 시 진행"* 사유로 명시적으로 스킵했다.
   AI 제안을 전량 수용하지 않고 우선순위·맥락으로 취사선택한 기록이다.
   → 근거: [PR #242 코멘트](https://github.com/26-ewha-capstone-logue/logue/pull/242#issuecomment-4552633496)
   *"@coderabbitai clear_cache()만 고쳤습니다! 나머지는 마이너함 + 후속 리팩토링/문서 작업 시 진행해도 될 것 같아 스킵하겠습니다!"*

---

## 4. 제품 내 AI 투명성 (사용자 관점)
- **모델 라우팅**: 난이도별 분리 — 파일분석·요약 `nano`, 질문분석 `mini`. (`apps/ai/config/`)
- **출력 통제**: `temperature 0~0.1`, `max_output_tokens` 상한 명시, Structured Outputs.
- **검증/품질**: 자체 eval 하네스 70케이스 **94.2% pass**(파일분석 100% / 질문분석 90.7% / 요약 100%),
  잔여 실패는 전부 hard-fail이 아닌 복구 가능 필드. (발표 82p, `apps/ai/eval/`)
- **비용 투명성**: 호출당 `estimated_cost_usd` 기록(≈$0.0045/flow), 로그는 원문 대신 개수만 남기는 redaction. (`apps/ai/observability/`)
- **한계 고지**: 마케팅·CRM 도메인, `comparison`/`ranking`만 안정 지원 — README "지원 범위/Known Limitations"에 명시.

---

## 5. 한계와 정직한 고지
- 제품 AI는 비결정적이라 단일 실행 스냅샷이 낙관적일 수 있음 → 다회 실행 안정성 측정은 후속 과제(발표 83p).
- 동의어·모호어 등 "서술적 해석" 구간에서 LLM 실패율이 상대적으로 높음(질문분석 90.7%).
- 개발 보조 AI 산출물은 100% 사람이 재검증했다고 단정하지 않으며, 검수 누락 가능성은 회귀 테스트·CI로 보완한다.

---

## 6. 한눈 요약 (슬라이드용 3줄)
1. AI는 **초안·탐지·요약**까지, 사람은 **설계·결정·책임**까지 — 경계를 코드/설정으로 강제했다.
2. CodeRabbit은 권고형+라벨게이팅, AI 구현분은 별도 브랜치 리뷰 — **머지 결정은 항상 사람**.
3. 제품 AI는 계산을 하지 않는다 — 구조화·표현만 하고, 룰 검증을 통과해야 노출된다.
