import { type HTMLAttributes } from 'react';

export type CellProps = {
  state?: 'header' | 'low';
  children?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

export default function Cell({
  state = 'header',
  children = '칼럼명 입력',
  className = '',
  ...rest
}: CellProps) {
  const isHeader = state === 'header';

  return (
    <div
      className={`inline-flex h-[4.1rem] items-center border-b border-r border-gray-500 px-20 py-[1rem] ${
        isHeader ? 'bg-gray-200 text-body3' : 'bg-white text-body2'
      } text-center text-gray-800 ${className}`.trim()}
      {...rest}
    >
      <span className="whitespace-nowrap">{children}</span>
    </div>
  );
}
