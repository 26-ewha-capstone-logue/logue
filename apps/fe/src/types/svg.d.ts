/**
 * SVGR 모듈 선언
 *
 * `src/assets/icons/*.svg` 는 SVGR 에 의해 React 컴포넌트로 import 됩니다.
 * 다색 일러스트는 `public/illusts/` 에 두고 정적 URL 로 참조하세요.
 */
declare module '*.svg' {
  import type { FunctionComponent, SVGProps } from 'react';
  const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
