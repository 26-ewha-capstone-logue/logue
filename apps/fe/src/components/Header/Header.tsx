import { type HTMLAttributes, type ReactNode } from 'react';

export type NavItem = {
  label: string;
  href: string;
  icon?: ReactNode;
};

export type HeaderProps = {
  /** 네비게이션 메뉴 목록 */
  navItems?: NavItem[];
  /** 프로필 영역 (커스텀 ReactNode, 기본: 프로필 아이콘) */
  profileSlot?: ReactNode;
  /** 로고 클릭 콜백 */
  onLogoClick?: () => void;
  /** 프로필 클릭 콜백 */
  onProfileClick?: () => void;
  /** 메뉴 클릭 콜백 */
  onNavClick?: (href: string) => void;
} & Omit<HTMLAttributes<HTMLElement>, 'children'>;

function LogoIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="20" height="20" x="4" y="6" rx="4" fill="#FC8320" />
      <rect
        width="16"
        height="16"
        x="2"
        y="4"
        rx="4"
        fill="#FFA947"
        opacity="0.8"
      />
      <rect
        width="12"
        height="12"
        x="0"
        y="2"
        rx="3"
        fill="#FFD365"
        opacity="0.6"
      />
    </svg>
  );
}

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
      <path
        d="M8 28c0-5.523 4.477-10 10-10s10 4.477 10 10"
        fill="#BFBFBF"
      />
    </svg>
  );
}

function DefaultNavIcon() {
  return (
    <span className="inline-block h-12 w-12 shrink-0 rounded-2 bg-mint-400" />
  );
}

export default function Header({
  navItems = [],
  profileSlot,
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
        <LogoIcon />
        <span className="text-head3 font-bold text-gray-900">Logue</span>
      </button>

      {/* 네비게이션 */}
      <nav className="flex items-center gap-20">
        {navItems.map((item) => (
          <button
            key={item.href}
            type="button"
            onClick={() => onNavClick?.(item.href)}
            className="flex items-center gap-[0.6rem] text-body2 text-gray-800 transition-colors hover:text-orange-500"
          >
            {item.icon ?? <DefaultNavIcon />}
            {item.label}
          </button>
        ))}
      </nav>

      {/* 우측 프로필 */}
      <div className="ml-auto">
        {profileSlot ?? (
          <button type="button" onClick={onProfileClick}>
            <ProfileIcon />
          </button>
        )}
      </div>
    </header>
  );
}
