# refactor-scan

`apps/{fe,be,ai}` 의 **구조적 리팩토링 백로그**를 LiteLLM(Claude) 로 자동 수집해 GitHub 이슈로 발행하는 워크플로.

CodeRabbit 이 PR 단위 라인 리뷰를 담당하고, 이 워크플로는 그 사이즈로 못 잡는 모듈/패키지 단위의 리팩토링 포인트를 누적 관리하는 목적이다 (`.coderabbit.yaml` 의 역할과 겹치지 않게).

## 동작 개요

```
push apps/{fe,be,ai}/**
        │
        ▼
  detect job ────► 파트별 변경 파일 수가 임계치를 넘었는가?
        │                                          │
        │ no → 끝                                   │ yes
        ▼                                          ▼
  scan matrix (fail-fast: false)
        │
        ├─ collect_context.sh  (변경 diff + 디렉터리 트리)
        ├─ prompts/{part}.md   (CodeRabbit 와 겹치지 않게 구조 레벨만)
        ├─ call_litellm.sh     (3슬롯 키 폴백)
        ├─ create_issue.sh     (라벨/담당자/last_sha 메타 포함)
        └─ Update LAST_SCAN_SHA_{PART}  (다음 임계치 계산 기준)
```

## 시크릿 / 변수 셋업

### Secrets (Repository → Settings → Secrets and variables → Actions → Secrets)

| 이름 | 필수 | 설명 |
|---|---|---|
| `LITELLM_API_KEY_1` | ✅ | 1순위 키. 401/402/429/empty 응답 시 슬롯 2로 폴백. |
| `LITELLM_API_KEY_2` | 권장 | 2순위 키. 1번 키 크레딧 소진 시 사용. |
| `LITELLM_API_KEY_3` | 선택 | 3순위 키. (예: 합류 예정 멤버 키) |
| `REFACTOR_SCAN_VARS_TOKEN` | 권장 | `LAST_SCAN_SHA_*` repo variables 갱신용 PAT. fine-grained PAT 권장 — Repository permissions: **Variables: Read & Write**. 없으면 워크플로는 동작하되 SHA 갱신은 스킵되어 매 푸시마다 임계치 초과로 잡힘. |

> 키는 모두 LiteLLM Virtual Key. 운영자에게 발급받은 값을 그대로 사용.

### Variables (Repository → Settings → Secrets and variables → Actions → Variables)

| 이름 | 기본값 | 설명 |
|---|---|---|
| `LITELLM_BASE_URL` | (필수) | 예: `http://43.201.226.184:4000` |
| `LITELLM_MODEL` | (필수) | LiteLLM 에 등록된 모델 ID. 운영자에게 확인. |
| `LITELLM_MAX_TOKENS` | `2048` | 응답 토큰 상한. 비용 관리용. |
| `LITELLM_THRESHOLD_FE` | `20` | fe 파트 누적 변경 파일 임계치. 넘으면 발사. |
| `LITELLM_THRESHOLD_BE` | `15` | be 파트 임계치. |
| `LITELLM_THRESHOLD_AI` | `10` | ai 파트 임계치. |
| `LAST_SCAN_SHA_FE` | (자동 갱신) | fe 마지막 스캔 시점 SHA. 워크플로가 성공 시 자동 갱신. 초기엔 비워둠. |
| `LAST_SCAN_SHA_BE` | (자동 갱신) | be 마지막 스캔 시점 SHA. |
| `LAST_SCAN_SHA_AI` | (자동 갱신) | ai 마지막 스캔 시점 SHA. |

`LAST_SCAN_SHA_*` 가 비어 있으면 첫 실행은 "현재 추적 파일 전체 수" 로 임계치 비교 — 보통 강제 발사된다. 첫 발사 이후부터 정상 동작.

## 로컬에서 dry-run

```bash
# 1. 컨텍스트 수집
bash scripts/refactor-scan/collect_context.sh ai HEAD~30 > /tmp/ctx.md

# 2. 프롬프트 합치기
cat scripts/refactor-scan/prompts/ai.md /tmp/ctx.md > /tmp/prompt.md

# 3. LiteLLM 호출 (키/URL 설정 필요)
export LITELLM_BASE_URL=http://43.201.226.184:4000
export LITELLM_MODEL=<model-id>
export LITELLM_API_KEY_1=<key>
bash scripts/refactor-scan/call_litellm.sh < /tmp/prompt.md > /tmp/llm.md

# 4. 이슈 생성 dry-run (실제 발행 X)
DRY_RUN=1 bash scripts/refactor-scan/create_issue.sh ai /tmp/llm.md "$(git rev-parse HEAD)"
```

## GitHub Actions 에서 수동 트리거

Actions → Refactor Scan → Run workflow:

- **part**: `all` (기본) 또는 `fe`/`be`/`ai` 단일.
- **dry_run**: `true` 면 이슈 생성/SHA 갱신 모두 스킵, 아티팩트만 업로드.
- **force**: `true` 면 임계치 무시하고 발사 (디버깅용).

아티팩트 이름: `refactor-scan-{part}-{run_id}` (보존 14일). raw LLM 응답 / 프롬프트 / 컨텍스트가 들어있어 결과가 이상할 때 원본 확인 가능.

## 임계치 조정

기본값 fe=20, be=15, ai=10 은 추측이다. 1~2주 운영해보고 노이즈가 심하면 임계치를 올리고, 너무 안 발사되면 내려라. Repository Variables 의 `LITELLM_THRESHOLD_*` 만 바꾸면 yml 수정 불필요.

## 비용 추정

1회 호출당 대략:
- 입력 토큰: 컨텍스트 6~12k (파트별 변경량에 따라)
- 출력 토큰: `LITELLM_MAX_TOKENS` 상한 (기본 2048, 보통 1k 안쪽)

Claude Sonnet 가격 기준 1회 발사당 \$0.03~0.10 예상. \$60 예산이면 600~2000회 호출 가능. 파트별 임계치 잘 설정하면 운영 기간 충분.

> ⚠️ LiteLLM 엔드포인트가 HTTP 평문이다 (`http://43.201.226.184:4000`). Actions runner 의 아웃바운드는 동적 IP 라 화이트리스트 비현실적. HTTPS 전환 또는 OIDC 게이트웨이 옵션을 운영자와 검토 권장.

## 트러블슈팅

| 증상 | 원인 / 대응 |
|---|---|
| `error: no LITELLM_API_KEY_{1,2,3} set` | Secrets 미설정. 최소 1개 등록 필요. |
| `all N LiteLLM key slot(s) exhausted` | 모든 키 크레딧 소진 또는 모델 ID 오류. LiteLLM 어드민 페이지에서 사용량/모델 확인. |
| 매 푸시마다 이슈 발사됨 | `REFACTOR_SCAN_VARS_TOKEN` 미설정 → `LAST_SCAN_SHA_*` 갱신 안 됨. PAT 발급 필요. |
| 이슈 본문이 비어있음 | LLM 응답 빈 content → 자동 슬롯 폴백. 그래도 비면 모델 ID/프롬프트 길이 점검. 아티팩트에서 raw 응답 확인. |
| 라벨 없음 에러 | `auto-generated` 라벨 사전 생성 필요: `gh label create auto-generated --color ededed --repo 26-ewha-capstone-logue/logue` |

## 관련 이슈
- 셋업 트래커: https://github.com/26-ewha-capstone-logue/logue/issues/110
- CodeRabbit 설정: `.coderabbit.yaml` (역할 분리)
- CODEOWNERS: `.github/CODEOWNERS` (담당자 자동 할당 매핑 기반)
