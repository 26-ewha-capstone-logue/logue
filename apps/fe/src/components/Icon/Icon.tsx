import { type ComponentType, type SVGProps } from 'react';
import AlertIcon from '@/assets/icons/alert.svg';
import ArrowDownIcon from '@/assets/icons/arrow-down.svg';
import ArrowLeftIcon from '@/assets/icons/arrow-left.svg';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg';
import ArrowUpIcon from '@/assets/icons/arrow-up.svg';
import CancelIcon from '@/assets/icons/cancel.svg';
import ChatIcon from '@/assets/icons/chat.svg';
import FileIcon from '@/assets/icons/file.svg';
import HistoryIcon from '@/assets/icons/history-2.svg';
import PlusIcon from '@/assets/icons/plus.svg';
import PriceIcon from '@/assets/icons/price.svg';
import SearchIcon from '@/assets/icons/search.svg';
import SuccessIcon from '@/assets/icons/success.svg';
import TrashIcon from '@/assets/icons/trash.svg';

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
  size?: 12 | 16 | 20 | 24 | 28 | 32 | 36 | 44 | 60;
} & Omit<SVGProps<SVGSVGElement>, 'children'>;

const icons: Record<IconName, ComponentType<SVGProps<SVGSVGElement>>> = {
  'arrow-up': ArrowUpIcon,
  'arrow-down': ArrowDownIcon,
  'arrow-left': ArrowLeftIcon,
  'arrow-right': ArrowRightIcon,
  plus: PlusIcon,
  alert: AlertIcon,
  success: SuccessIcon,
  cancel: CancelIcon,
  file: FileIcon,
  history: HistoryIcon,
  chat: ChatIcon,
  search: SearchIcon,
  trash: TrashIcon,
  price: PriceIcon,
};

export default function Icon({
  name,
  size = 24,
  className = '',
  ...rest
}: IconProps) {
  const SvgIcon = icons[name];

  return (
    <SvgIcon
      aria-hidden
      className={`icon-${size} ${className}`.trim()}
      {...rest}
    />
  );
}
