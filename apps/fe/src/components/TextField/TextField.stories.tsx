import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import TextField from './TextField';

const meta = {
  title: 'Components/TextField',
  component: TextField,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    placeholder: '이번달이랑 지난달 비교해서 지역별 매출 높은 순으로 5개 보여줘',
    onSubmit: fn(),
    onFileAttach: fn(),
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-200 p-40">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ── Default ── */

export const Default: Story = {
  args: {
    submitDisabled: false,
  },
};

/* ── 입력 없이 전송 비활성화 ── */

export const Empty: Story = {
  args: {
    placeholder: '메시지를 입력하세요',
    submitDisabled: true,
  },
};

/* ── Full Width ── */

export const FullWidth: Story = {
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="bg-gray-200 p-40">
        <Story />
      </div>
    ),
  ],
  args: {
    fullWidth: true,
  },
};

/* ── Interactive: 입력 상태에 따라 전송 버튼 활성화 ── */

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return (
      <TextField
        {...args}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        submitDisabled={value.trim().length === 0}
        onSubmit={() => {
          args.onSubmit?.();
          setValue('');
        }}
      />
    );
  },
};

/* ── 모든 상태 한눈에 ── */

export const AllVariants: Story = {
  tags: ['!autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="bg-gray-200 p-40">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-col gap-32">
      <section>
        <h3 className="mb-12 text-head4 text-gray-900">Default</h3>
        <TextField
          placeholder="이번달이랑 지난달 비교해서 지역별 매출 높은 순으로 5개 보여줘"
          onSubmit={fn()}
          onFileAttach={fn()}
        />
      </section>

      <section>
        <h3 className="mb-12 text-head4 text-gray-900">
          전송 비활성화 (빈 입력)
        </h3>
        <TextField
          placeholder="메시지를 입력하세요"
          submitDisabled
          onSubmit={fn()}
          onFileAttach={fn()}
        />
      </section>

      <section>
        <h3 className="mb-12 text-head4 text-gray-900">Full Width</h3>
        <TextField
          placeholder="전체 너비 입력"
          fullWidth
          onSubmit={fn()}
          onFileAttach={fn()}
        />
      </section>
    </div>
  ),
};
