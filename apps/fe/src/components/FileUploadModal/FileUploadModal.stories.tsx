import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import FileUploadModal from './FileUploadModal';

const meta = {
  title: 'Components/FileUploadModal',
  component: FileUploadModal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    open: true,
    onClose: fn(),
    onUpload: fn(),
    onError: fn(),
  },
} satisfies Meta<typeof FileUploadModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Interactive: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);

    return (
      <div className="flex min-h-[48rem] items-center justify-center bg-gray-200 p-40">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-222 bg-orange-500 px-20 py-12 text-body2 text-white"
        >
          Open upload
        </button>
        <FileUploadModal
          {...args}
          open={open}
          onClose={() => {
            setOpen(false);
            args.onClose?.();
          }}
        />
      </div>
    );
  },
};
