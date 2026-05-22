import { type HTMLAttributes, type ReactNode } from 'react';
import Button from '../Button/Button';
import DataRow from '../DataRow/DataRow';

export type ChatDropdownState = 'default' | 'drop' | 'selected';

export type ChatDropdownProps = {
  state?: ChatDropdownState;
  title?: string;
  contents?: string;
  showGraph?: boolean;
  showData?: boolean;
  showError?: boolean;
  footer?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

const rows = [
  { title: '날짜 기준', contents: 'signup_date, created_at' },
  { title: '날짜 기준', contents: 'signup_date, created_at' },
  { title: '날짜 기준', contents: 'signup_date, created_at' },
  { title: '날짜 기준', contents: 'signup_date, created_at' },
];

function DownIcon() {
  return (
    <svg className="icon-20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="icon-20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3.5 21 20H3L12 3.5Z" fill="#FC8320" />
      <path
        d="M12 8.5v5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.6" r="1" fill="white" />
    </svg>
  );
}

function ChartPreview() {
  const bars = [120, 200, 150, 90, 75, 125, 145];
  const max = 220;

  return (
    <div className="h-[36.9rem] w-full rounded-8 border border-gray-400 bg-white p-24">
      <div className="mb-20 flex gap-24 text-body2">
        <span className="text-gray-600">채널</span>
        <span className="border-b border-gray-900 pb-8 text-gray-900">
          디바이스
        </span>
      </div>
      <div className="flex h-[28rem] items-end gap-18 border-b border-gray-400 pl-24">
        {bars.map((value, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-8">
            <span className="rounded-full bg-orange-500 px-6 py-2 text-body4 text-white">
              {value}
            </span>
            <span
              className="w-full max-w-[3rem] rounded-t-12 bg-orange-400"
              style={{ height: `${(value / max) * 20}rem` }}
            />
            <span className="text-body4 text-gray-800">이름{index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChatDropdown({
  state = 'default',
  title = '데이터를 확인했어요.',
  contents = '내용을 입력해주세요.',
  showGraph = state !== 'default',
  showData = state !== 'default',
  showError = state === 'selected',
  footer,
  className = '',
  ...rest
}: ChatDropdownProps) {
  const expanded = state !== 'default';

  return (
    <div
      className={`flex min-w-[32rem] flex-col rounded-12 border border-[#f0e6dc] bg-white p-20 ${
        expanded ? 'w-[57.2rem] gap-14' : 'max-w-[59rem] gap-13'
      } ${className}`.trim()}
      {...rest}
    >
      <div className="flex flex-col gap-6 text-body2 tracking-[-0.0375rem]">
        <p className="text-body3 text-[#1f1f1f]">{title}</p>
        <p className="text-gray-900">{contents}</p>
      </div>

      <button
        type="button"
        className={`inline-flex items-center gap-4 text-body4 text-gray-900 ${
          expanded ? 'w-full justify-start' : ''
        }`}
      >
        <DownIcon />
        데이터 요약
      </button>

      {showGraph && <ChartPreview />}

      {showData && (
        <div className="flex w-full flex-col gap-2 rounded-8 border border-gray-400 bg-white p-[1.7rem]">
          <div className="flex gap-[4.4rem] border-b border-gray-300 pb-[0.9rem] text-body3 text-gray-900">
            <span className="w-[8rem]">Name</span>
            <span>예시</span>
          </div>
          {rows.map((row, index) => (
            <DataRow
              key={index}
              title={row.title}
              contents={row.contents}
              state={
                state === 'selected' && index % 2 === 0 ? 'selected' : 'default'
              }
              className="w-full"
            />
          ))}
        </div>
      )}

      {showError && (
        <div className="flex flex-col gap-20">
          <div className="flex items-center gap-6 text-body3 text-gray-900">
            <WarningIcon />
            데이터 경고
          </div>
          <ul className="list-disc space-y-8 pl-24 text-body2 text-black">
            <li>날짜 기준을 하나로 정할 수 없어요.</li>
            <li>현재 질문에 필요한 항목이 데이터에 없어요.</li>
            <li>분석에 필요한 값이 일부 비어 있어요.</li>
          </ul>
        </div>
      )}

      {state === 'selected' && (
        <div className="flex justify-end gap-8">
          {footer ?? (
            <>
              <Button variant="outlined" size="sm">
                수정하기
              </Button>
              <Button size="sm">이 기준으로 계속 할게요</Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
