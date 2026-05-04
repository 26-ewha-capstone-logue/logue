import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import Header from './Header';

const sampleNav = [
  { label: '메뉴명', href: '/menu1' },
  { label: '메뉴명', href: '/menu2' },
  { label: '메뉴명', href: '/menu3' },
];

const meta = {
  title: 'Components/Header',
  component: Header,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    navItems: sampleNav,
    onLogoClick: fn(),
    onNavClick: fn(),
    onProfileClick: fn(),
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoNav: Story = {
  args: {
    navItems: [],
  },
};

export const ManyItems: Story = {
  args: {
    navItems: [
      { label: '대시보드', href: '/dashboard' },
      { label: '리포트', href: '/reports' },
      { label: '데이터', href: '/data' },
      { label: '설정', href: '/settings' },
    ],
  },
};

export const AllVariants: Story = {
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="flex flex-col gap-32 bg-gray-200 p-40">
      <section>
        <p className="mb-12 text-body4 text-gray-600">기본</p>
        <Header
          navItems={sampleNav}
          onLogoClick={fn()}
          onNavClick={fn()}
          onProfileClick={fn()}
        />
      </section>
      <section>
        <p className="mb-12 text-body4 text-gray-600">메뉴 없음</p>
        <Header onLogoClick={fn()} onProfileClick={fn()} />
      </section>
    </div>
  ),
};
