import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';

import FileUploadZone from './FileUploadZone';

const meta = {
  title: 'Components/FileUploadZone',
  component: FileUploadZone,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    onFileSelect: fn(),
    onError: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-[60rem] p-40">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileUploadZone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Interactive: Story = {
  render: (args) => {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    return (
      <div className="flex flex-col gap-16">
        <FileUploadZone
          {...args}
          onFileSelect={(f) => {
            setFile(f);
            setError('');
            args.onFileSelect?.(f);
          }}
          onError={(msg) => {
            setError(msg);
            setFile(null);
            args.onError?.(msg);
          }}
        />
        {file && (
          <p className="text-body2 text-orange-500">
            선택된 파일: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
        {error && <p className="text-body2 text-error-500">{error}</p>}
      </div>
    );
  },
};
