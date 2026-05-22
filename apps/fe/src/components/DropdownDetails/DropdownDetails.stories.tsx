import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import DropdownDetails from './DropdownDetails';

const options = [
  { label: 'internal_text 제외', value: 'internal-1' },
  { label: 'internal_text 제외', value: 'internal-2' },
  { label: 'internal_text 제외', value: 'internal-3' },
  { label: 'internal_text 제외', value: 'internal-4' },
];

const meta: Meta<typeof DropdownDetails> = {
  title: 'Components/DropdownDetails',
  component: DropdownDetails,
  tags: ['autodocs'],
  args: { options, onSelect: fn() },
};

export default meta;
type Story = StoryObj<typeof DropdownDetails>;

export const Multi: Story = {
  args: { type: 'checkbox', selectedValues: ['internal-4'] },
};

export const Single: Story = {
  args: { type: 'radio', selectedValues: ['internal-4'] },
};
