'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Header, type NavItem } from '@/components';
import FileIcon from '@/assets/icons/file.svg';
import GTapIcon from '@/assets/icons/G-tap.svg';
import GHistoryIcon from '@/assets/icons/G-history.svg';
import SearchIcon from '@/assets/icons/search.svg';

const NAV_ITEMS: NavItem[] = [
  { label: '파일분석', href: '/analysis', Icon: FileIcon },
  { label: '데이터 소스', href: '/data', Icon: GTapIcon },
  { label: '히스토리', href: '/history', Icon: GHistoryIcon },
];

function DataSourceSearchInput() {
  // TODO: URL searchParams 연동 / 디바운스 등
  return (
    <div className="flex items-center gap-8 rounded-full border border-gray-300 bg-white px-12 py-8">
      <SearchIcon aria-hidden className="icon-16 text-gray-500" />
      <input
        type="text"
        placeholder="찾고 싶은 데이터 소스를 입력해주세요."
        className="w-[26rem] bg-transparent text-body4 text-gray-900 outline-none placeholder:text-gray-500"
      />
    </div>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const showDataSearch = pathname.startsWith('/data');

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-200">
      <Header
        navItems={NAV_ITEMS}
        activeHref={pathname}
        searchSlot={showDataSearch ? <DataSourceSearchInput /> : undefined}
        onLogoClick={() => router.push('/analysis')}
        onNavClick={(href) => router.push(href)}
      />
      {children}
    </div>
  );
}
