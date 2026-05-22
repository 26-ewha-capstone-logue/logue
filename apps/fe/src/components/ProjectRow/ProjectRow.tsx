'use client';

import { type HTMLAttributes } from 'react';
import Button from '../Button/Button';
import Checkbox from '../Checkbox/Checkbox';

export type ProjectRowProps = {
  type?: 'row' | 'header';
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  onChat?: () => void;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

function ChatIcon() {
  return (
    <svg className="icon-16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 5.5h14v9H9.8L6 18.5v-4H5v-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProjectRow({
  type = 'row',
  fileName = '파일명.csv',
  fileSize = '50MB',
  uploadedAt = '5분 전',
  selected = false,
  onSelect,
  onChat,
  className = '',
  ...rest
}: ProjectRowProps) {
  const isHeader = type === 'header';

  return (
    <div
      className={`flex h-[7.7rem] w-full max-w-[132rem] items-center border-b border-gray-300 ${
        isHeader ? 'bg-gray-300 text-gray-900' : 'bg-white text-gray-800'
      } ${className}`.trim()}
      {...rest}
    >
      <div className="flex h-full w-[7rem] shrink-0 items-center justify-center px-16 py-20">
        <Checkbox
          size="md"
          checked={selected}
          onCheckedChange={onSelect}
          aria-label={isHeader ? '전체 선택' : `${fileName} 선택`}
        />
      </div>
      <div className="flex min-w-0 flex-1 items-center">
        <span className="w-[21.8rem] shrink-0 truncate px-16 py-20 text-head4">
          {isHeader ? '파일명' : fileName}
        </span>
        <span className="w-[9.6rem] shrink-0 px-16 py-20 text-head4">
          {isHeader ? '파일 크기' : fileSize}
        </span>
        <span className="w-[11.2rem] shrink-0 px-16 py-20 text-head4">
          {isHeader ? '최근 업로드' : uploadedAt}
        </span>
        <div className="ml-auto flex shrink-0 items-center justify-end px-16 py-20">
          {isHeader ? (
            <span className="text-head4">액션</span>
          ) : (
            <Button
              variant="outlined"
              size="sm"
              icon={<ChatIcon />}
              onClick={onChat}
            >
              채팅
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
