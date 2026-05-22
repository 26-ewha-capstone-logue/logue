import { type HTMLAttributes, type ReactNode } from 'react';

function AlertIcon() {
  return (
    <svg className="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.5 21 20H3L12 3.5Z"
        fill="#FC8320"
        stroke="#FC8320"
        strokeLinejoin="round"
      />
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

export type ToastAlertProps = {
  icon?: ReactNode;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

export default function ToastAlert({
  icon = <AlertIcon />,
  children = '텍스트 입력',
  className = '',
  ...rest
}: ToastAlertProps) {
  return (
    <div
      role="status"
      className={`inline-flex h-[4.8rem] items-center gap-8 rounded-12 bg-black/80 px-20 py-[1.4rem] text-body3 text-white ${className}`.trim()}
      {...rest}
    >
      <span className="inline-flex shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="whitespace-nowrap">{children}</span>
    </div>
  );
}
