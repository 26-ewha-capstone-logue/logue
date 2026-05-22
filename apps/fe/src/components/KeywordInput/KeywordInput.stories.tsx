import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import KeywordInput from './KeywordInput';

const meta: Meta<typeof KeywordInput> = {
  title: 'Components/KeywordInput',
  component: KeywordInput,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof KeywordInput>;

export const SmallDefault: Story = {
  args: { width: 'sm', children: '키워드입력', selected: false },
};

export const SmallSelected: Story = {
  args: { width: 'sm', children: '키워드입력', selected: true },
};

export const LargeDefault: Story = {
  args: { width: 'lg', children: '키워드입력', selected: false },
};

export const LargeSelected: Story = {
  args: { width: 'lg', children: '키워드입력', selected: true },
};
