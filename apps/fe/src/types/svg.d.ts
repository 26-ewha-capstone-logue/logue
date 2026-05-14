/**
 * SVGR 모듈 선언
 *
 * - `import Icon from './icon.svg'`      → React 컴포넌트
 * - `import url from './icon.svg?url'`   → URL 문자열
 */

declare module '*.svg' {
  import type { FunctionComponent, SVGProps } from 'react';
  const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module '*.svg?url' {
  const src: string;
  export default src;
}
