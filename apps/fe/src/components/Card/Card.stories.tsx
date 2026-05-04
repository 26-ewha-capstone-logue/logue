import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import Card from './Card';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    title: '분야명',
    description: '세부 설명 1줄 이내',
    onClick: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-[30rem] p-40">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongDescription: Story = {
  args: {
    title: '마케팅',
    description: '디지털 마케팅 전략 수립부터 실행까지 전 과정을 다룹니다',
  },
};

export const NoDescription: Story = {
  args: {
    title: '디자인',
    description: undefined,
  },
};

export const WithThumbnail: Story = {
  args: {
    title: '데이터 분석',
    description: '비즈니스 인사이트 도출',
    thumbnail: (
      <div className="flex h-full w-full items-center justify-center text-head3 text-gray-500">
        📊
      </div>
    ),
  },
};

export const NotClickable: Story = {
  args: {
    title: '비클릭',
    description: 'onClick이 없으면 정적 카드',
    onClick: undefined,
  },
};

export const AllVariants: Story = {
  tags: ['!autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="p-40">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-col gap-32">
      <section>
        <h3 className="mb-12 text-head4 text-gray-900">카드 목록</h3>
        <div className="grid grid-cols-4 gap-24">
          <Card title="마케팅" description="디지털 마케팅 전략" onClick={fn()} />
          <Card title="데이터 분석" description="비즈니스 인사이트 도출" onClick={fn()} />
          <Card title="디자인" description="UI/UX 디자인 시스템" onClick={fn()} />
          <Card title="개발" onClick={fn()} />
        </div>
      </section>
    </div>
  ),
};
