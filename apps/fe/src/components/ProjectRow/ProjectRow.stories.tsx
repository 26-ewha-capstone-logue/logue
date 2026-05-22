import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import ProjectRow from './ProjectRow';

const meta: Meta<typeof ProjectRow> = {
  title: 'Components/ProjectRow',
  component: ProjectRow,
  tags: ['autodocs'],
  args: { onSelect: fn(), onChat: fn() },
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof ProjectRow>;

export const Row: Story = {
  args: {
    type: 'row',
    fileName: '파일명.csv',
    fileSize: '50MB',
    uploadedAt: '5분 전',
  },
};

export const Header: Story = { args: { type: 'header' } };
