import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import IconBox from './IconBox';

function StarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
        fill="currentColor"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="currentColor"
      />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" fill="currentColor" />
    </svg>
  );
}

const meta = {
  title: 'Components/IconBox',
  component: IconBox,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    icon: <StarIcon />,
  },
} satisfies Meta<typeof IconBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: <StarIcon />,
    variant: 'orange',
    size: 'md',
  },
  argTypes: {
    variant: { control: 'select', options: ['orange', 'blue', 'gray'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
};

export const Blue: Story = {
  args: {
    icon: <HeartIcon />,
    variant: 'blue',
    size: 'md',
  },
};

export const Gray: Story = {
  args: {
    icon: <BoltIcon />,
    variant: 'gray',
    size: 'md',
  },
};

export const AllVariants: Story = {
  tags: ['!autodocs'],
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex flex-col gap-32">
      <section>
        <h3 className="mb-12 text-head4 text-gray-900">Variants</h3>
        <div className="flex flex-wrap items-center gap-16">
          <IconBox icon={<StarIcon />} variant="orange" />
          <IconBox icon={<HeartIcon />} variant="blue" />
          <IconBox icon={<BoltIcon />} variant="gray" />
        </div>
      </section>

      <section>
        <h3 className="mb-12 text-head4 text-gray-900">Sizes</h3>
        <div className="flex flex-wrap items-center gap-16">
          <IconBox icon={<StarIcon />} size="sm" />
          <IconBox icon={<StarIcon />} size="md" />
          <IconBox icon={<StarIcon />} size="lg" />
        </div>
      </section>

      <section>
        <h3 className="mb-12 text-head4 text-gray-900">All Combinations</h3>
        <div className="flex flex-wrap items-center gap-16">
          {(['orange', 'blue', 'gray'] as const).map((v) =>
            (['sm', 'md', 'lg'] as const).map((s) => (
              <IconBox key={`${v}-${s}`} icon={<StarIcon />} variant={v} size={s} />
            )),
          )}
        </div>
      </section>
    </div>
  ),
};
