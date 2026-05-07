import type { Meta, StoryObj } from '@storybook/react';
import { ConfirmModal } from './Modal';

const meta: Meta<typeof ConfirmModal> = {
  title: 'Components/ConfirmModal',
  component: ConfirmModal,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof ConfirmModal>;

export const Delete: Story = {
  args: {
    open: true,
    title: '파일을 삭제하시겠어요?',
    description: '삭제 후엔 복구할 수 없어요.',
    confirmLabel: '삭제하기',
    cancelLabel: '취소하기',
  },
};
