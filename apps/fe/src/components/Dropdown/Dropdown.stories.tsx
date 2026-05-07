import type { Meta, StoryObj } from '@storybook/react';
import Dropdown from './Dropdown';

const meta: Meta<typeof Dropdown> = {
  title: 'Components/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Dropdown>;

export const Default: Story = {
  args: {
    options: [
      { label: '사용량 많은 순', value: 'usage' },
      { label: '최근 업로드 순', value: 'recent' },
    ],
    placeholder: '최근 업로드 순',
  },
};

export const WithValue: Story = {
  args: {
    options: [
      { label: '이번 주', value: 'this_week' },
      { label: '지난 주', value: 'last_week' },
      { label: '이번 달', value: 'this_month' },
    ],
    value: 'this_week',
  },
};
