import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import Button from './Button';

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type StoryOnlyArgs = { storyShowIcon?: boolean };

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { children: '버튼', onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── 스토리 1: CTA (Controls로 disabled, children, icon 조작) ── */

export const CTA = {
  args: {
    variant: 'cta',
    children: '다음',
    disabled: false,
    storyShowIcon: false,
  } as Story['args'],
  argTypes: {
    variant: { table: { disable: true } },
    size: { table: { disable: true } },
    fullWidth: { table: { disable: true } },
    storyShowIcon: {
      control: 'boolean',
      name: '아이콘',
      table: { category: 'Story only' },
    },
  },
  render: (args) => {
    const { storyShowIcon, ...props } = args as typeof args & StoryOnlyArgs;
    return (
      <Button
        {...props}
        icon={storyShowIcon ? <ChevronRightIcon /> : undefined}
      />
    );
  },
} as Story;

/* ── 스토리 2: Primary (Controls로 size, disabled, children, icon, fullWidth 조작) ── */

export const Primary = {
  args: {
    variant: 'primary',
    children: '버튼',
    size: 'md',
    disabled: false,
    fullWidth: false,
    storyShowIcon: false,
  } as Story['args'],
  argTypes: {
    variant: { table: { disable: true } },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    storyShowIcon: {
      control: 'boolean',
      name: '아이콘',
      table: { category: 'Story only' },
    },
  },
  render: (args) => {
    const { storyShowIcon, ...props } = args as typeof args & StoryOnlyArgs;
    return (
      <Button
        {...props}
        icon={storyShowIcon ? <ChevronRightIcon /> : undefined}
      />
    );
  },
} as Story;

/* ── Docs 전용: 모든 종류 한눈에 ── */

export const AllVariants: Story = {
  tags: ['!autodocs'],
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex flex-col gap-32">
      <section>
        <h3 className="mb-12 text-head4 text-gray-900">CTA</h3>
        <div className="flex flex-wrap items-center gap-16">
          <Button variant="cta">다음</Button>
          <Button variant="cta" icon={<ChevronRightIcon />}>
            다음
          </Button>
          <Button variant="cta" disabled>
            다음
          </Button>
        </div>
      </section>

      <section>
        <h3 className="mb-12 text-head4 text-gray-900">일반 버튼 (Primary)</h3>

        <p className="mb-8 text-body4 text-gray-600">Size L / M / S</p>
        <div className="flex flex-wrap items-center gap-16">
          <Button variant="primary" size="lg">
            Large
          </Button>
          <Button variant="primary" size="md">
            Medium
          </Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
        </div>

        <p className="mb-8 mt-24 text-body4 text-gray-600">아이콘</p>
        <div className="flex flex-wrap items-center gap-16">
          <Button variant="primary" size="lg" icon={<ChevronRightIcon />}>
            Large
          </Button>
          <Button variant="primary" size="md" icon={<ChevronRightIcon />}>
            Medium
          </Button>
          <Button variant="primary" size="sm" icon={<ChevronRightIcon />}>
            Small
          </Button>
        </div>

        <p className="mb-8 mt-24 text-body4 text-gray-600">Hover</p>
        <p className="text-body4 text-gray-500">
          마우스를 올려 주세요 (흰 배경 + 오렌지 글자)
        </p>

        <p className="mb-8 mt-24 text-body4 text-gray-600">Disabled</p>
        <div className="flex flex-wrap items-center gap-16">
          <Button variant="primary" size="lg" disabled>
            Large
          </Button>
          <Button variant="primary" size="md" disabled>
            Medium
          </Button>
          <Button variant="primary" size="sm" disabled>
            Small
          </Button>
        </div>

        <p className="mb-8 mt-24 text-body4 text-gray-600">Full Width</p>
        <Button variant="primary" fullWidth>
          전체 너비
        </Button>
      </section>
    </div>
  ),
};
