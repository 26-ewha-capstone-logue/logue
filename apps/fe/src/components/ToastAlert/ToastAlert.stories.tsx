import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ToastAlert from './ToastAlert';

const meta: Meta<typeof ToastAlert> = {
  title: 'Components/ToastAlert',
  component: ToastAlert,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ToastAlert>;

export const Default: Story = { args: { children: '텍스트 입력' } };
