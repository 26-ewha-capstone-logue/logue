import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import IconButton from './IconButton';

const meta: Meta<typeof IconButton> = {
  title: 'Components/IconButton',
  component: IconButton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Empty: Story = { args: { state: 'empty' } };
export const Default: Story = { args: { state: 'default' } };
export const Field: Story = { args: { state: 'field' } };
export const Hover: Story = { args: { state: 'hover' } };
