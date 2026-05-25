'use client';

import PriceIcon from '@/assets/icons/price.svg';
import SuccessIcon from '@/assets/icons/success.svg';

const LOGO_SRC = '/illusts/logo.svg';

type IntroNavItem = {
  label: string;
  href: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const NAV_ITEMS: IntroNavItem[] = [
  { label: '요금', href: '/pricing', Icon: PriceIcon },
  { label: '서비스', href: '/service', Icon: SuccessIcon },
];

export type IntroHeaderProps = {
  scrolled: boolean;
  onLogoClick: () => void;
  onLoginClick: () => void;
  onNavClick: (href: string) => void;
};

export default function IntroHeader({
  scrolled,
  onLogoClick,
  onLoginClick,
  onNavClick,
}: IntroHeaderProps) {
  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 flex items-center px-32 py-16 transition-colors duration-200 ${
        scrolled
          ? 'bg-white shadow-[0_0.1rem_0.4rem_rgba(0,0,0,0.06)]'
          : 'bg-[rgba(17,17,17,0.20)] shadow-[0_0.1rem_1.2rem_rgba(252,131,32,0.20)] backdrop-blur-[0.71rem]'
      }`}
    >
      <button
        type="button"
        onClick={onLogoClick}
        aria-label="Logue 홈으로 이동"
        className="mr-24 flex shrink-0 items-center gap-8"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_SRC} alt="Logue" className="h-28 w-auto" />
      </button>

      <nav className="flex items-center gap-20">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.href}
            type="button"
            onClick={() => onNavClick(item.href)}
            className="flex items-center gap-8"
          >
            <item.Icon
              aria-hidden
              className={`icon-20 transition-colors ${
                scrolled ? 'text-gray-400' : 'text-white/60'
              }`}
            />
            <span
              className={`text-body2 transition-colors ${
                scrolled ? 'text-gray-800' : 'text-white'
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-20">
        <button
          type="button"
          onClick={onLoginClick}
          className={`text-body2 underline underline-offset-2 transition-colors ${
            scrolled
              ? 'text-gray-900 hover:text-gray-700'
              : 'text-white hover:text-white/80'
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={onLoginClick}
          className={`rounded-full px-20 py-8 text-body2 font-medium transition-colors ${
            scrolled
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-white text-gray-900 hover:bg-gray-100'
          }`}
        >
          회원가입
        </button>
      </div>
    </header>
  );
}
