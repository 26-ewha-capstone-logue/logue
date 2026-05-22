import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import SelectableListItem from './SelectableListItem';

const meta: Meta<typeof SelectableListItem> = {
  title: 'Components/SelectableListItem',
  component: SelectableListItem,
  tags: ['autodocs'],
  args: { label: 'internal_text 제외', onClick: fn() },
};

export default meta;
type Story = StoryObj<typeof SelectableListItem>;

export const CheckboxDefault: Story = { args: { type: 'checkbox' } };
export const CheckboxSelected: Story = {
  args: { type: 'checkbox', selected: true },
};
export const RadioDefault: Story = { args: { type: 'radio' } };
export const RadioSelected: Story = { args: { type: 'radio', selected: true } };
