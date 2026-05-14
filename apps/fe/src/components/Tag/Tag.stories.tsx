import type { Meta, StoryObj } from '@storybook/react';
import Tag from './Tag';

const meta: Meta<typeof Tag> = {
  title: 'Components/Tag',
  component: Tag,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Tag>;

export const Orange: Story = { args: { variant: 'orange', children: '라벨라벨' } };
export const Blue: Story = { args: { variant: 'blue', children: '라벨라벨' } };
export const Gray: Story = { args: { variant: 'gray', children: '라벨라벨' } };
export const Error: Story = { args: { variant: 'error', children: '라벨라벨' } };
