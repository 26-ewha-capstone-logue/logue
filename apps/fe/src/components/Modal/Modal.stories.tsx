import type { Meta, StoryObj } from '@storybook/nextjs-vite';
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

export const LongText: Story = {
  args: {
    open: true,
    title: '선택한 데이터 소스를 삭제하시겠어요?',
    description:
      '삭제 후에는 이 데이터 소스를 사용하는 임시 분석 결과와 연결 정보를 다시 불러올 수 없습니다.',
    confirmLabel: '삭제하기',
    cancelLabel: '취소하기',
  },
};
