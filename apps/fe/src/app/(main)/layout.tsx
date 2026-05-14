'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Header, type NavItem } from '@/components';
import FileIcon from '@/assets/icons/file.svg';
import GTapIcon from '@/assets/icons/G-tap.svg';
import GHistoryIcon from '@/assets/icons/G-history.svg';

const NAV_ITEMS: NavItem[] = [
  { label: '파일분석', href: '/analysis', Icon: FileIcon },
  { label: '데이터 소스', href: '/data', Icon: GTapIcon },
  { label: '히스토리', href: '/history', Icon: GHistoryIcon },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-gray-200">
      <Header
        navItems={NAV_ITEMS}
        activeHref={pathname}
        onLogoClick={() => router.push('/analysis')}
        onNavClick={(href) => router.push(href)}
      />
      {children}
    </div>
  );
}
