import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import DataRow from './DataRow';

const meta: Meta<typeof DataRow> = {
  title: 'Components/DataRow',
  component: DataRow,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[60rem] bg-gray-300 p-20">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof DataRow>;

export const Default: Story = {
  args: { title: '날짜 기준', contents: '데이터 내용 입력' },
};

export const Selected: Story = {
  args: {
    title: '날짜 기준',
    state: 'selected',
    dropdownValue: 'internal_test',
  },
};
