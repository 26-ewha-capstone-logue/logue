'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Header } from '@/components';

const NAV_ITEMS = [
  { label: '파일분석', href: '/analysis' },
  { label: '데이터 소스', href: '/data' },
  { label: '히스토리', href: '/history' },
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
        onLogoClick={() => router.push('/analysis')}
        onNavClick={(href) => router.push(href)}
      />
      {children}
    </div>
  );
}
