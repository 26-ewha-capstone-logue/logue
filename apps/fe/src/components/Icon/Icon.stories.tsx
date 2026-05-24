import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import Icon, { type IconName } from './Icon';

const names: IconName[] = [
  'arrow-up',
  'arrow-down',
  'arrow-left',
  'arrow-right',
  'plus',
  'alert',
  'success',
  'cancel',
  'file',
  'history',
  'chat',
  'search',
  'trash',
  'price',
];

const meta: Meta<typeof Icon> = {
  title: 'Components/Icon',
  component: Icon,
  tags: ['autodocs'],
  args: { name: 'arrow-up', size: 24 },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = {};

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap gap-16 text-gray-900">
      {names.map((name) => (
        <div key={name} className="flex flex-col items-center gap-4">
          <Icon name={name} />
          <span className="text-body4">{name}</span>
        </div>
      ))}
    </div>
  ),
};
