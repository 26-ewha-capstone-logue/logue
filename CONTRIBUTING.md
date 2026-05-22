# Contributing to Logue

## 목차

- [브랜치 전략](#브랜치-전략)
- [커밋 컨벤션](#커밋-컨벤션)
- [로컬 개발 환경](#로컬-개발-환경)

---

## 브랜치 전략

### 브랜치 구조

```
main        ← 프로덕션 배포 기준
dev         ← 통합 개발 브랜치 (PR 타겟)
│
├── feat/fe/#이슈번호-작업명
├── feat/be/#이슈번호-작업명
├── feat/ai/#이슈번호-작업명
├── fix/fe/#이슈번호-작업명
├── fix/be/#이슈번호-작업명
├── chore/#이슈번호-작업명    ← 루트 설정 등 앱 무관한 작업
└── ...
```

### PR 흐름

```
feat/be/#42-auth-api  →  dev  →  main
```

- 기능/버그 브랜치는 항상 `dev`로 PR
- `dev` → `main`은 배포 준비 완료 시점에 진행

### 브랜치 명명 규칙

| 타입 | 형식 | 예시 |
|---|---|---|
| 기능 추가 | `feat/{앱}/#이슈번호-설명` | `feat/be/#42-auth-api` |
| 버그 수정 | `fix/{앱}/#이슈번호-설명` | `fix/fe/#55-login-redirect` |
| 리팩토링 | `refactor/{앱}/#이슈번호-설명` | `refactor/be/#60-service-layer` |
| 문서 | `docs/#이슈번호-설명` | `docs/#10-api-spec` |
| 설정/잡일 | `chore/#이슈번호-설명` | `chore/#7-ci-setup` |

`{앱}` : `fe` / `be` / `ai`

---

## 커밋 컨벤션

한 줄, `prefix: 한국어` 형식을 따릅니다.

```
feat: 로그인 API 구현
fix: 토큰 만료 처리 오류 수정
refactor: UserService 레이어 분리
chore: CI 배포 스크립트 추가
docs: API 명세 업데이트
test: 인증 유닛 테스트 추가
```

| Prefix | 용도 |
|---|---|
| `feat` | 기능 추가 |
| `fix` | 버그 수정 |
| `refactor` | 리팩토링 |
| `chore` | 빌드/설정/잡일 |
| `docs` | 문서 |
| `test` | 테스트 |
| `perf` | 성능 개선 |
| `ci` | CI/CD 변경 |

---

## 로컬 개발 환경

### 공통 사전 준비

```bash
git clone https://github.com/26-ewha-capstone-logue/logue.git
cd logue
```

---

### apps/fe (Next.js)

**필요 도구:** Node.js 20+, Yarn

```bash
cd apps/fe
yarn install
yarn dev        # http://localhost:3000
```

| 명령어 | 설명 |
|---|---|
| `yarn dev` | 개발 서버 실행 |
| `yarn build` | 프로덕션 빌드 |
| `yarn lint` | ESLint 검사 |
| `yarn vitest` | 테스트 실행 |
| `yarn storybook` | Storybook 실행 (http://localhost:6006) |

---

### apps/be (Spring Boot)

**필요 도구:** JDK 21, PostgreSQL, Redis

```bash
cd apps/be
./gradlew bootRun      # http://localhost:8080
```

환경 변수는 `src/main/resources/application-local.yml` 또는 `.env`로 관리하세요.

| 명령어 | 설명 |
|---|---|
| `./gradlew bootRun` | 개발 서버 실행 |
| `./gradlew bootJar` | JAR 빌드 |
| `./gradlew test` | 테스트 실행 |

Swagger UI: http://localhost:8080/swagger-ui/index.html

---

### apps/ai (FastAPI)

**필요 도구:** Python 3.11+, [uv](https://docs.astral.sh/uv/)

```bash
cd apps/ai
uv sync                                              # 의존성 설치
uv run uvicorn main:app --reload --port 8000         # http://localhost:8000
```

| 명령어 | 설명 |
|---|---|
| `uv run uvicorn main:app --reload` | 개발 서버 실행 |
| `uv run pytest` | 테스트 실행 |

API 문서: http://localhost:8000/docs

#### 디렉토리 구조 (BE · AI 공동 작업)

`apps/ai`는 FastAPI 위에서 BE 파트와 AI 파트가 함께 작업합니다. 디렉토리별 담당은 아래와 같아요.

| 디렉토리 | 담당 | 역할 |
|---|---|---|
| `routers/` | 🟦 BE | 엔드포인트 정의 (`@router.post(...)`), 요청 → 서비스 호출 → 응답 리턴 |
| `schemas/` | 🟦 BE | 요청/응답 Pydantic 스키마 정의 |
| `services/` | 🟦 BE 껍데기 → 🟨 AI 로직 | AI 호출 라우팅 레이어. BE가 함수 시그니처와 더미 응답까지 먼저 만들고, AI 파트가 실제 로직으로 교체 |
| `core/` | 🟨 AI | semantic role 분류, 프롬프트 설계, 모델 호출, 후처리 등 AI 세부 로직 |
| `tests/` | 🟦 BE · 🟨 AI | 각자 작업한 범위 단위 테스트 |

**협업 흐름**

1. BE가 `routers/` · `schemas/` · `services/` 껍데기(더미 응답) 먼저 머지
2. AI가 `services/` 내부 로직과 `core/` 구현을 이어받아 머지
3. 이슈는 `파트: be` / `파트: ai`로 **각각 분리해서** 등록 (템플릿상 단일 파트만 선택 가능)

---

### Makefile 단축 명령

루트에서 아래 명령을 사용할 수도 있어요.

```bash
make dev-fe    make dev-be    make dev-ai
make test-fe   make test-be   make test-ai
make build-fe  make build-be  make build-ai
```
