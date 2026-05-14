import type { Meta, StoryObj } from '@storybook/react';
import DataRow from './DataRow';

const meta: Meta<typeof DataRow> = {
  title: 'Components/DataRow',
  component: DataRow,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[80rem]"><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof DataRow>;

export const Header: Story = {
  args: { isHeader: true, fileName: '', fileSize: '', uploadedAt: '' },
};

export const Default: Story = {
  args: { fileName: '파일명.csv', fileSize: '50MB', uploadedAt: '5분 전' },
};

export const Selected: Story = {
  args: { fileName: '파일명.csv', fileSize: '50MB', uploadedAt: '5분 전', selected: true },
};
