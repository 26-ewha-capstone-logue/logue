import type { NextConfig } from 'next';

/**
 * SVG 처리 규칙 (SVGR)
 *
 * - `import Icon from './icon.svg'`        → React 컴포넌트로 가져옴 (기본)
 * - `import url from './icon.svg?url'`     → URL 문자열로 가져옴 (next/image 등에 사용)
 *
 * Turbopack(dev/build)와 webpack(폴백) 양쪽 모두 설정합니다.
 */
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  webpack(config) {
    // 기존 Next.js 의 svg 처리 규칙을 찾는다
    const fileLoaderRule = config.module.rules.find(
      (rule: { test?: RegExp }) =>
        rule.test instanceof RegExp && rule.test.test('.svg'),
    );

    config.module.rules.push(
      // 1) `?url` 쿼리가 붙은 경우는 URL 로딩 (기존 동작 유지)
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },
      // 2) 그 외의 svg 는 SVGR 로 React 컴포넌트화
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule?.issuer,
        resourceQuery: { not: [...(fileLoaderRule?.resourceQuery?.not ?? []), /url/] },
        use: ['@svgr/webpack'],
      },
    );

    if (fileLoaderRule) {
      fileLoaderRule.exclude = /\.svg$/i;
    }

    return config;
  },
};

export default nextConfig;
