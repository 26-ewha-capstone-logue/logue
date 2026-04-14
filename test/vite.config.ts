import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 별도 서버 없이 정적 프런트만 쓰므로 기본 React 플러그인 설정만 유지한다.
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'logue-test';
const productionBase = repositoryName.endsWith('.github.io') ? '/' : `/${repositoryName}/`;

export default defineConfig(({ command }) => ({
  // 로컬 개발에서는 항상 루트 경로를 사용해 접속 주소 혼동을 줄인다.
  base: command === 'serve' ? '/' : productionBase,
  plugins: [react()],
}));
