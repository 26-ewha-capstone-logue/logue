# Logue

<br />

# Logue 🎙️ <img src="assets/logo.png" width="110" align="left" />
AI 기반 대화 분석 서비스

<br />

###  

<br/>

<img src="assets/banner.png" alt="Logue Banner" width="100%" />

<br/>
<br/>

## 📁 프로젝트 구조

```
logue/
├── apps/
│   ├── fe/          Next.js 16 · TypeScript · Tailwind CSS
│   ├── be/          Spring Boot 3.5 · Java 21 · PostgreSQL · Redis
│   └── ai/          FastAPI · Python 3.11 · uv
├── .github/         CI/CD · Issue/PR 템플릿 · CODEOWNERS
├── Makefile         루트 단축 명령
└── CONTRIBUTING.md  브랜치 전략 · 커밋 컨벤션
```

<br/>

## 🛠 기술스택

### Frontend

| 역할 | 종류 |
| ---- | ---- |
| Framework | ![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white) |
| Language | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=TypeScript&logoColor=white) |
| Styling | ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-%231a202c?style=for-the-badge&logo=tailwind-css) |
| UI Documentation | ![Storybook](https://img.shields.io/badge/Storybook-FF4785?style=for-the-badge&logo=storybook&logoColor=white) |
| Data Fetching | ![Tanstack Query](https://img.shields.io/badge/Tanstack_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white) ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white) |
| Testing | ![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white) ![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white) |
| Formatting | ![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white) ![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black) |
| Package Manager | ![Yarn](https://img.shields.io/badge/Yarn-2C8EBB?style=for-the-badge&logo=yarn&logoColor=white) |

### Backend

| 역할 | 종류 |
| ---- | ---- |
| Language / Framework | ![Java](https://img.shields.io/badge/Java_21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white) ![Spring Boot](https://img.shields.io/badge/Spring_Boot_3-6DB33F?style=for-the-badge&logo=springboot&logoColor=white) ![Spring AOP](https://img.shields.io/badge/Spring_AOP-6DB33F?style=for-the-badge&logo=spring&logoColor=white) |
| DB / Storage | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) ![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white) ![AWS RDS](https://img.shields.io/badge/AWS_RDS-527FFF?style=for-the-badge&logo=amazonrds&logoColor=white) ![AWS S3](https://img.shields.io/badge/AWS_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white) ![Flyway](https://img.shields.io/badge/Flyway-CC0200?style=for-the-badge&logo=flyway&logoColor=white) |
| Infra / CI-CD | ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) ![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white) ![AWS EC2](https://img.shields.io/badge/AWS_EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white) ![Route 53](https://img.shields.io/badge/Route_53-8C4FFF?style=for-the-badge&logo=amazonroute53&logoColor=white) |
| Observability / Logging | ![CloudWatch](https://img.shields.io/badge/CloudWatch-FF4F8B?style=for-the-badge&logo=amazoncloudwatch&logoColor=white) ![Sentry](https://img.shields.io/badge/Sentry-362D59?style=for-the-badge&logo=sentry&logoColor=white) ![SLF4J](https://img.shields.io/badge/SLF4J_/_Logback-25A162?style=for-the-badge) |
| Security | ![Spring Security](https://img.shields.io/badge/Spring_Security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white) ![OAuth2](https://img.shields.io/badge/OAuth_2.0-EB5424?style=for-the-badge&logo=auth0&logoColor=white) ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white) |
| Documentation | ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black) |
| Testing | ![k6](https://img.shields.io/badge/k6-7D64FF?style=for-the-badge&logo=k6&logoColor=white) ![p6spy](https://img.shields.io/badge/p6spy-333333?style=for-the-badge) |

### AI

| 역할 | 종류 |
| ---- | ---- |
| Language / Framework | ![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white) |
| LLM | ![OpenAI](https://img.shields.io/badge/OpenAI_API-412991?style=for-the-badge&logo=openai&logoColor=white) |
| Validation / Schema | ![Pydantic](https://img.shields.io/badge/Pydantic_v2-E92063?style=for-the-badge&logo=pydantic&logoColor=white) |
| Data Processing | ![pandas](https://img.shields.io/badge/pandas-150458?style=for-the-badge&logo=pandas&logoColor=white) ![sentence-transformers](https://img.shields.io/badge/sentence--transformers-FF6F00?style=for-the-badge&logo=huggingface&logoColor=white) |
| Server | ![Uvicorn](https://img.shields.io/badge/Uvicorn-2F4858?style=for-the-badge&logo=uvicorn&logoColor=white) |
| Testing | ![pytest](https://img.shields.io/badge/pytest-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white) |
| Package Manager | ![uv](https://img.shields.io/badge/uv-DE5FE9?style=for-the-badge&logo=uv&logoColor=white) |
| Infra | ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white) ![AWS EC2](https://img.shields.io/badge/AWS_EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white) |

### Common

| 역할 | 종류 |
| ---- | ---- |
| Version Control | ![Git](https://img.shields.io/badge/Git-%23F05033?style=for-the-badge&logo=git&logoColor=white) ![GitHub](https://img.shields.io/badge/GitHub-%23121011?style=for-the-badge&logo=github&logoColor=white) |

<br/>

## 🚀 빠른 시작

```bash
git clone https://github.com/26-ewha-capstone-logue/logue.git
cd logue
```

| 앱 | 개발 서버 | 테스트 | 빌드 |
| :--: | :-- | :-- | :-- |
| **FE** | `make dev-fe` | `make test-fe` | `make build-fe` |
| **BE** | `make dev-be` | `make test-be` | `make build-be` |
| **AI** | `make dev-ai` | `make test-ai` | `make build-ai` |

> 각 앱의 상세 설정은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요.

<br/>

## 🌿 브랜치 전략

```
main ← 프로덕션 배포
 └── dev ← 통합 개발 (PR 타겟)
      ├── feat/fe/#이슈번호-설명
      ├── feat/be/#이슈번호-설명
      ├── feat/ai/#이슈번호-설명
      └── fix/fe/#이슈번호-설명
```

자세한 컨벤션은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요.

<br/>

## 👥 팀

| <img src="https://github.com/maetelson.png" width="120" /> | <img src="https://github.com/gyesswhat.png" width="120" /> | <img src="https://github.com/yeeeww.png" width="120" /> | <img src="https://github.com/jxxxxxn.png" width="120" /> |
| :--: | :--: | :--: | :--: |
| **손하늘** | **김겨레** | **김예원** | **민지인** |
| 기획 · AI | Backend | Frontend · AI | Backend |
| [@maetelson](https://github.com/maetelson) | [@gyesswhat](https://github.com/gyesswhat) | [@yeeeww](https://github.com/yeeeww) | [@jxxxxxn](https://github.com/jxxxxxn) |

<br/>
<br/>

<div align="center">
<sub>이화여자대학교 캡스톤디자인 2026</sub>
</div>
