# Logue

Logue 서비스의 모노레포입니다.

## 구조

```
apps/
├── fe/   # Next.js 16 (TypeScript)
├── be/   # Spring Boot 3.5 (Java 21)
└── ai/   # FastAPI (Python 3.11)
```

## 시작하기

각 앱의 README를 참고하세요.

- [apps/fe/README.md](apps/fe/README.md)
- [apps/be/README.md](apps/be/README.md)
- [apps/ai/README.md](apps/ai/README.md)

또는 루트의 `Makefile` 단축 명령을 사용하세요.

```bash
make dev-fe    # 프론트엔드 개발 서버
make dev-be    # 백엔드 개발 서버
make dev-ai    # AI 서비스 개발 서버

make test-fe   # FE 테스트
make test-be   # BE 테스트
make test-ai   # AI 테스트
```
