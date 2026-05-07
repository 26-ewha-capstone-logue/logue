import type { Meta, StoryObj } from '@storybook/react';
import KeywordInput from './KeywordInput';

const meta: Meta<typeof KeywordInput> = {
  title: 'Components/KeywordInput',
  component: KeywordInput,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof KeywordInput>;

export const Text: Story = {
  args: { mode: 'text', placeholder: '키워드입력' },
};

export const RadioDefault: Story = {
  args: { mode: 'radio', value: '키워드입력', selected: false },
};

export const RadioSelected: Story = {
  args: { mode: 'radio', value: '키워드입력', selected: true },
};

export const CheckboxDefault: Story = {
  args: { mode: 'checkbox', value: '키워드입력', selected: false },
};

export const CheckboxSelected: Story = {
  args: { mode: 'checkbox', value: '키워드입력', selected: true },
};
