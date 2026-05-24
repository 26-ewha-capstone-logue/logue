'use client';

import { Suspense, useEffect, useState, type CSSProperties } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getMyInfo, userKeys, type GetUserInfoResponse } from '@/apis/user';
import { Header, type NavItem } from '@/components';
import FileIcon from '@/assets/icons/file.svg';
import GTapIcon from '@/assets/icons/G-tap.svg';
import GHistoryIcon from '@/assets/icons/G-history.svg';
import SearchIcon from '@/assets/icons/search.svg';
import { clearAuthTokens, skipNextAuthEntryRedirect } from '@/lib/auth';
import { useAuthSession } from '@/providers/AuthProvider';

const NAV_ITEMS: NavItem[] = [
  { label: '파일분석', href: '/analysis', Icon: FileIcon },
  { label: '데이터 소스', href: '/data', Icon: GTapIcon },
  { label: '히스토리', href: '/history', Icon: GHistoryIcon },
];

const SEARCH_PARAM_KEY = 'q';
const SEARCH_DEBOUNCE_MS = 250;
const USER_INFO_STALE_TIME = 5 * 60 * 1000;

function DataSourceSearchInput({ pathname }: { pathname: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const querySearchValue = searchParams.get(SEARCH_PARAM_KEY) ?? '';
  const [searchDraft, setSearchDraft] = useState(() => ({
    sourceQueryValue: querySearchValue,
    value: querySearchValue,
  }));
  const searchValue =
    searchDraft.sourceQueryValue === querySearchValue
      ? searchDraft.value
      : querySearchValue;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParamsString);
      const trimmedValue = searchValue.trim();

      if (trimmedValue) {
        params.set(SEARCH_PARAM_KEY, trimmedValue);
      } else {
        params.delete(SEARCH_PARAM_KEY);
      }

      const queryString = params.toString();
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
      const currentUrl = searchParamsString
        ? `${pathname}?${searchParamsString}`
        : pathname;

      if (currentUrl !== nextUrl) {
        router.replace(nextUrl, { scroll: false });
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [pathname, router, searchParamsString, searchValue]);

  // TODO: URL searchParams 연동 / 디바운스 등
  return (
    <div className="flex items-center gap-8 rounded-full border border-gray-300 bg-white px-12 py-8">
      <SearchIcon aria-hidden className="icon-16 text-gray-500" />
      <input
        type="search"
        aria-label="데이터 소스 검색"
        value={searchValue}
        onChange={(event) =>
          setSearchDraft({
            sourceQueryValue: querySearchValue,
            value: event.target.value,
          })
        }
        placeholder="찾고 싶은 데이터 소스를 입력해주세요."
        className="w-[26rem] bg-transparent text-body4 text-gray-900 outline-none placeholder:text-gray-500"
      />
    </div>
  );
}

function getUserInitial(user: GetUserInfoResponse | undefined) {
  return user?.name?.trim().slice(0, 1).toUpperCase() || 'U';
}

function getProfileImageStyle(
  profileImageUrl: string | null | undefined,
): CSSProperties | undefined {
  const imageUrl = profileImageUrl?.trim();
  if (!imageUrl) return undefined;

  return {
    backgroundImage: `url("${imageUrl.replace(/["\\]/g, '\\$&')}")`,
  };
}

function UserProfileSlot({
  user,
  isLoading,
  isError,
}: {
  user: GetUserInfoResponse | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return (
      <span
        aria-label="Loading profile"
        className="inline-flex h-36 w-36 animate-pulse rounded-full bg-gray-300"
      />
    );
  }

  const profileImageStyle = getProfileImageStyle(user?.profileImageUrl);

  return (
    <span
      aria-label={
        isError
          ? 'Profile unavailable'
          : user?.name
            ? `${user.name} profile`
            : 'Profile'
      }
      title={isError ? undefined : user?.email}
      style={profileImageStyle}
      className={`inline-flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-gray-300 text-body3 font-semibold text-gray-700 ${
        profileImageStyle ? 'bg-cover bg-center text-transparent' : ''
      }`.trim()}
    >
      {getUserInitial(user)}
    </span>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { hasAccessToken } = useAuthSession();
  const {
    data: myInfo,
    isError: isUserInfoError,
    isLoading: isUserInfoLoading,
  } = useQuery({
    queryKey: userKeys.me(),
    queryFn: getMyInfo,
    enabled: hasAccessToken,
    staleTime: USER_INFO_STALE_TIME,
  });

  const showDataSearch = pathname.startsWith('/data');
  const handleLogout = () => {
    clearAuthTokens();
    queryClient.removeQueries({ queryKey: userKeys.me() });
    router.replace('/');
  };
  const handleLogoClick = () => {
    skipNextAuthEntryRedirect();
    router.push('/');
  };

  const profileSlot = hasAccessToken ? (
    <div className="flex items-center gap-12">
      <UserProfileSlot
        user={myInfo}
        isLoading={isUserInfoLoading}
        isError={isUserInfoError}
      />
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-full border border-gray-300 px-12 py-8 text-body4 font-medium text-gray-700 transition-colors hover:border-orange-500 hover:text-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"
      >
        로그아웃
      </button>
    </div>
  ) : undefined;

  const handleProfileClick = () => {
    router.push('/login');
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-200">
      <Header
        navItems={NAV_ITEMS}
        activeHref={pathname}
        profileSlot={profileSlot}
        searchSlot={
          showDataSearch ? (
            <Suspense fallback={null}>
              <DataSourceSearchInput pathname={pathname} />
            </Suspense>
          ) : undefined
        }
        onLogoClick={handleLogoClick}
        onNavClick={(href) => router.push(href)}
        onProfileClick={hasAccessToken ? undefined : handleProfileClick}
      />
      {children}
    </div>
  );
}
