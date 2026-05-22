import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import Radio from './Radio';

const meta: Meta<typeof Radio> = {
  title: 'Components/Radio',
  component: Radio,
  tags: ['autodocs'],
  args: { onCheckedChange: fn() },
};

export default meta;
type Story = StoryObj<typeof Radio>;

export const Default: Story = { args: { checked: false } };
export const Selected: Story = { args: { checked: true } };
