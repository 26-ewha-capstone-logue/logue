import type { NextConfig } from 'next';

/**
 * SVG 처리 규칙 (SVGR)
 *
 * - `src/assets/icons/*.svg`   → React 컴포넌트로 import 됨 (SVGR + currentColor 변환)
 *     예) `import Icon from '@/assets/icons/file.svg'`
 * - `public/illusts/*.svg`     → 정적 자산. URL 문자열(`/illusts/...`)로 직접 참조
 *     (Turbopack 은 ?url 쿼리 분기를 지원하지 않으므로 다색 일러스트는 public/ 에 둔다)
 *
 * SVGR 옵션:
 * - `dimensions: false`  → svg 의 width/height 속성 제거 → className 의 사이즈 클래스가 먹히도록
 * - `convertColors`      → 모든 fill/stroke 색을 currentColor 로 변환 → text-* 로 색 제어
 */
const svgrOptions = {
  dimensions: false,
  svgoConfig: {
    plugins: [
      {
        name: 'preset-default',
        params: { overrides: { removeViewBox: false } },
      },
      {
        name: 'convertColors',
        params: { currentColor: true },
      },
    ],
  },
};

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [{ loader: '@svgr/webpack', options: svgrOptions }],
        as: '*.js',
      },
    },
  },

  webpack(config) {
    const fileLoaderRule = config.module.rules.find(
      (rule: { test?: RegExp }) =>
        rule.test instanceof RegExp && rule.test.test('.svg'),
    );

    config.module.rules.push({
      test: /\.svg$/i,
      issuer: fileLoaderRule?.issuer,
      use: [{ loader: '@svgr/webpack', options: svgrOptions }],
    });

    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }

    return config;
  },
};

export default nextConfig;
