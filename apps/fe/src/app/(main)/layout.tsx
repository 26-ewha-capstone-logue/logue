'use client';

import { useEffect, useState } from 'react';
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

const SEARCH_PARAM_KEY = 'q';
const SEARCH_DEBOUNCE_MS = 250;

function DataSourceSearchInput({ pathname }: { pathname: string }) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(() => {
    if (typeof window === 'undefined') return '';

    const params = new URLSearchParams(window.location.search);
    return params.get(SEARCH_PARAM_KEY) ?? '';
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const trimmedValue = searchValue.trim();

      if (trimmedValue) {
        params.set(SEARCH_PARAM_KEY, trimmedValue);
      } else {
        params.delete(SEARCH_PARAM_KEY);
      }

      const queryString = params.toString();
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
      const currentUrl = `${window.location.pathname}${window.location.search}`;

      if (currentUrl !== nextUrl) {
        router.replace(nextUrl, { scroll: false });
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [pathname, router, searchValue]);

  return (
    <div className="flex items-center gap-8 rounded-full border border-gray-300 bg-white px-12 py-8">
      <SearchIcon aria-hidden className="icon-16 text-gray-500" />
      <input
        type="search"
        aria-label="데이터 소스 검색"
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
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
        searchSlot={
          showDataSearch ? (
            <DataSourceSearchInput pathname={pathname} />
          ) : undefined
        }
        onLogoClick={() => router.push('/analysis')}
        onNavClick={(href) => router.push(href)}
      />
      {children}
    </div>
  );
}
