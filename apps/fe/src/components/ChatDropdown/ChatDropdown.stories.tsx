import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ChatDropdown from './ChatDropdown';

const meta: Meta<typeof ChatDropdown> = {
  title: 'Components/ChatDropdown',
  component: ChatDropdown,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof ChatDropdown>;

export const Default: Story = { args: { state: 'default' } };
export const Drop: Story = { args: { state: 'drop' } };
export const Selected: Story = { args: { state: 'selected' } };
