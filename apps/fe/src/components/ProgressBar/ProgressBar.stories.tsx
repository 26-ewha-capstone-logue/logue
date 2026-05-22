import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ProgressBar from './ProgressBar';

const meta: Meta<typeof ProgressBar> = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Step1: Story = { args: { step: 1 } };
export const Step2: Story = { args: { step: 2 } };
export const Step3: Story = { args: { step: 3 } };
