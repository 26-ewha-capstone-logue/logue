import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'logue-test';
const productionBase = repositoryName.endsWith('.github.io') ? '/' : `/${repositoryName}/`;

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : productionBase,
  plugins: [react()],
}));
