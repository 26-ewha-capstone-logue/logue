import type { Meta, StoryObj } from '@storybook/react';
import Stepper from './Stepper';

const meta: Meta<typeof Stepper> = {
  title: 'Components/Stepper',
  component: Stepper,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Stepper>;

const steps = ['도메인 선택', '업무리스트', '사용 툴 선택'];

export const Step1: Story = { args: { steps, currentStep: 1 } };
export const Step2: Story = { args: { steps, currentStep: 2 } };
export const Step3: Story = { args: { steps, currentStep: 3 } };
