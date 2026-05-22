import { type ReactNode, type SVGAttributes } from 'react';

export type IconName =
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-left'
  | 'arrow-right'
  | 'plus'
  | 'alert'
  | 'success'
  | 'cancel'
  | 'file'
  | 'history'
  | 'chat'
  | 'search'
  | 'trash'
  | 'price';

export type IconProps = {
  name: IconName;
  size?: 16 | 20 | 24 | 28 | 32 | 36 | 44 | 60;
} & Omit<SVGAttributes<SVGSVGElement>, 'children'>;

const paths: Record<IconName, ReactNode> = {
  'arrow-up': (
    <path
      d="M12 19V5m0 0L6 11m6-6 6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  'arrow-down': (
    <path
      d="M12 5v14m0 0 6-6m-6 6-6-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  'arrow-left': (
    <path
      d="M19 12H5m0 0 6-6m-6 6 6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  'arrow-right': (
    <path
      d="M5 12h14m0 0-6-6m6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  plus: (
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  ),
  alert: (
    <>
      <path d="M12 3.5 21 20H3L12 3.5Z" fill="currentColor" />
      <path
        d="M12 8.5v5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.6" r="1" fill="white" />
    </>
  ),
  success: (
    <path
      d="m5 12 4 4 10-10"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  cancel: (
    <path
      d="m6 6 12 12M18 6 6 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  ),
  file: (
    <path
      d="M7 3h7l4 4v14H7V3Zm7 0v5h5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  ),
  history: (
    <path
      d="M5 12a7 7 0 1 0 2-4.9L5 9m0 0V5m0 4h4m3-1v5l3 2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  chat: (
    <path
      d="M5 5.5h14v9H9.8L6 18.5v-4H5v-9Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  ),
  search: (
    <path
      d="m20 20-4.2-4.2M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  ),
  trash: (
    <path
      d="M9 5h6m-9 3h12m-10 0 .7 12h6.6L16 8M10 5l.8-2h2.4L14 5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  price: (
    <path
      d="M12 3v18m4-14.5H9.8a2.8 2.8 0 0 0 0 5.6h4.4a2.8 2.8 0 0 1 0 5.6H8"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  ),
};

export default function Icon({
  name,
  size = 24,
  className = '',
  ...rest
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
