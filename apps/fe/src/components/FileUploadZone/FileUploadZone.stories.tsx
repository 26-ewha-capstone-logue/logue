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

export const Drag: Story = {
  args: { state: 'drag' },
};

export const Upload: Story = {
  args: {
    state: 'upload',
    fileName: '유니커넥트_사업자등록증.csv',
    progress: 36,
  },
};

export const LongFileNameUpload: Story = {
  args: {
    state: 'upload',
    fileName:
      '2026년_전국_지역별_매출_고객군_디바이스_채널_분석용_원본데이터_최종_수정본.csv',
    progress: 100,
  },
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
