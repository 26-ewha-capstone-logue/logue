import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ChatBubble from './ChatBubble';

const meta: Meta<typeof ChatBubble> = {
  title: 'Components/ChatBubble',
  component: ChatBubble,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[50rem]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ChatBubble>;

export const User: Story = {
  args: { role: 'user', children: '전환율이 왜 떨어졌을까?' },
};

export const Bot: Story = {
  args: {
    role: 'bot',
    children:
      '데이터를 확인했어요. 총 12,483명, 18열의 데이터가 업로드되었어요.',
  },
};

export const BotLoading: Story = {
  args: { role: 'bot', loading: true },
};
