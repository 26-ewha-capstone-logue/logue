'use client';

import { Suspense, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { logoutAuth } from '@/apis/auth';
import { userKeys } from '@/apis/user';
import { Header, type NavItem } from '@/components';
import FileIcon from '@/assets/icons/file.svg';
import GTapIcon from '@/assets/icons/G-tap.svg';
import GHistoryIcon from '@/assets/icons/G-history.svg';
import {
  clearAuthTokens,
  getRefreshToken,
  skipNextPrivatePathRedirect,
  skipNextAuthEntryRedirect,
} from '@/lib/auth';
import {
  OAUTH_LOGIN_POPUP_BLOCKED_MESSAGE,
  startOAuthLogin,
} from '@/lib/authRedirect';
import { useMyInfo } from '@/hooks/useMyInfo';
import { useAuthSession } from '@/providers/AuthProvider';
import DataSourceSearchInput from './_components/DataSourceSearchInput';
import UserProfileSlot from './_components/UserProfileSlot';

const NAV_ITEMS: NavItem[] = [
  { label: '파일분석', href: '/analysis', Icon: FileIcon },
  { label: '데이터 소스', href: '/data', Icon: GTapIcon },
  { label: '히스토리', href: '/history', Icon: GHistoryIcon },
];

export default function MainLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthSession();
  const {
    data: myInfo,
    isError: isUserInfoError,
    isLoading: isUserInfoLoading,
  } = useMyInfo(isAuthenticated);

  const showDataSearch = pathname.startsWith('/data');
  const handleLogout = () => {
    const refreshToken = getRefreshToken();

    skipNextPrivatePathRedirect();
    clearAuthTokens();
    queryClient.removeQueries({ queryKey: userKeys.me() });
    router.replace('/');

    if (refreshToken) {
      void logoutAuth(refreshToken).catch(() => undefined);
    }
  };
  const handleLogoClick = () => {
    skipNextAuthEntryRedirect();
    router.push('/');
  };

  const profileSlot = isAuthenticated ? (
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
    if (startOAuthLogin() !== 'opened') {
      window.alert(OAUTH_LOGIN_POPUP_BLOCKED_MESSAGE);
    }
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
        onProfileClick={isAuthenticated ? undefined : handleProfileClick}
      />
      {children}
    </div>
  );
}
