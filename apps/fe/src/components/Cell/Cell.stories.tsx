import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Cell from './Cell';

const meta: Meta<typeof Cell> = {
  title: 'Components/Cell',
  component: Cell,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Cell>;

export const Header: Story = {
  args: { state: 'header', children: '칼럼명 입력' },
};
export const Low: Story = { args: { state: 'low', children: '칼럼명 입력' } };
