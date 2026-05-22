import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Looper from './Looper';

const meta: Meta<typeof Looper> = {
  title: 'Components/Looper',
  component: Looper,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Looper>;

export const Active: Story = { args: { active: true } };
export const Empty: Story = { args: { active: false } };
