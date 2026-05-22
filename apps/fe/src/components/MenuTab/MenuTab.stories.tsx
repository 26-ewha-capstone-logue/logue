import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import MenuTab from './MenuTab';

function SquareIcon() {
  return <span className="inline-block h-20 w-20 bg-mint-400" />;
}

const meta: Meta<typeof MenuTab> = {
  title: 'Components/MenuTab',
  component: MenuTab,
  tags: ['autodocs'],
  args: { children: '메뉴명', icon: <SquareIcon /> },
};

export default meta;
type Story = StoryObj<typeof MenuTab>;

export const Default: Story = { args: { state: 'default' } };
export const Hover: Story = { args: { state: 'hover' } };
export const Tap: Story = { args: { state: 'tap' } };
