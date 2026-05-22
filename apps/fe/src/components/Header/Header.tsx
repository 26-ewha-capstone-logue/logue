import {
  type ComponentType,
  type HTMLAttributes,
  type ReactNode,
  type SVGProps,
} from 'react';

// 다색 일러스트는 SVGR 변환(currentColor)을 피하기 위해 public/ 정적 자산으로 둠
const LOGO_SRC = '/illusts/logo.svg';

export type NavItem = {
  label: string;
  href: string;
  /** SVG 컴포넌트 (active 상태에 따라 색상이 자동 적용됨) */
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
};

export type HeaderProps = {
  /** 네비게이션 메뉴 목록 */
  navItems?: NavItem[];
  /** 현재 활성화된 nav 의 href (보통 usePathname 결과) */
  activeHref?: string;
  /** 프로필 영역 (커스텀 ReactNode, 기본: 프로필 아이콘) */
  profileSlot?: ReactNode;
  /** 우측 검색 영역 (페이지별로 다를 수 있어 slot 으로 받음) */
  searchSlot?: ReactNode;
  /** 로고 클릭 콜백 */
  onLogoClick?: () => void;
  /** 프로필 클릭 콜백 */
  onProfileClick?: () => void;
  /** 메뉴 클릭 콜백 */
  onNavClick?: (href: string) => void;
} & Omit<HTMLAttributes<HTMLElement>, 'children'>;

function ProfileIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="18" cy="18" r="17" stroke="#BFBFBF" strokeWidth="2" />
      <circle cx="18" cy="14" r="5" fill="#BFBFBF" />
      <path d="M8 28c0-5.523 4.477-10 10-10s10 4.477 10 10" fill="#BFBFBF" />
    </svg>
  );
}

function isActiveHref(activeHref: string | undefined, itemHref: string) {
  if (!activeHref) return false;
  if (activeHref === itemHref) return true;
  return activeHref.startsWith(`${itemHref}/`);
}

export default function Header({
  navItems = [],
  activeHref,
  profileSlot,
  searchSlot,
  onLogoClick,
  onProfileClick,
  onNavClick,
  className = '',
  ...rest
}: HeaderProps) {
  return (
    <header
      className={`flex w-full items-center bg-white px-32 py-16 shadow-[0_0.1rem_0.4rem_rgba(0,0,0,0.06)] ${className}`.trim()}
      {...rest}
    >
      {/* 로고 */}
      <button
        type="button"
        onClick={onLogoClick}
        className="mr-24 flex shrink-0 items-center gap-8"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_SRC} alt="Logue" className="h-28 w-auto" />
      </button>

      {/* 네비게이션 */}
      <nav className="flex items-center gap-20">
        {navItems.map((item) => {
          const isActive = isActiveHref(activeHref, item.href);

          return (
            <button
              key={item.href}
              type="button"
              onClick={() => onNavClick?.(item.href)}
              aria-current={isActive ? 'page' : undefined}
              className="flex items-center gap-8 transition-colors"
            >
              {item.Icon && (
                <item.Icon
                  aria-hidden
                  className={`icon-20 transition-colors ${
                    isActive ? 'text-orange-500' : 'text-gray-400'
                  }`}
                />
              )}
              <span
                className={`text-body2 transition-colors ${
                  isActive ? 'text-gray-900' : 'text-gray-800'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* 우측 검색 + 프로필 */}
      <div className="ml-auto flex items-center gap-16">
        {searchSlot}
        {profileSlot ?? (
          <button type="button" onClick={onProfileClick}>
            <ProfileIcon />
          </button>
        )}
      </div>
    </header>
  );
}
