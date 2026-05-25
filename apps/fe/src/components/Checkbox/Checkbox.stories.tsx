import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import Checkbox from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: { onCheckedChange: fn() },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = { args: { checked: false } };
export const Selected: Story = { args: { checked: true } };
export const Indeterminate: Story = {
  args: { checked: false, indeterminate: true },
};
export const Medium: Story = { args: { checked: false, size: 'md' } };
