import { type DataSourceSummary } from '@/apis/datasource';
import ChatIcon from '@/assets/icons/chat.svg';
import { Checkbox } from '@/components';
import { formatDateTime } from '@/lib/dateTime';
import { formatFileSize } from '@/lib/fileValidation';

type DataSourceRowProps = {
  checked: boolean;
  chatDisabled: boolean;
  chatPending: boolean;
  dataSource: DataSourceSummary;
  onChat: (dataSource: DataSourceSummary) => void;
  onOpenDetail: (id: number) => void;
  onToggle: (id: number) => void;
};

export default function DataSourceRow({
  checked,
  chatDisabled,
  chatPending,
  dataSource,
  onChat,
  onOpenDetail,
  onToggle,
}: DataSourceRowProps) {
  return (
    <tr className="border-t border-gray-200 transition-colors hover:bg-gray-100">
      <td className="py-16 pl-24" onClick={(event) => event.stopPropagation()}>
        <Checkbox
          size="md"
          checked={checked}
          onCheckedChange={() => onToggle(dataSource.dataSourceId)}
          aria-label={`${dataSource.fileName} 선택`}
        />
      </td>
      <td className="py-16 text-gray-900">
        <button
          type="button"
          onClick={() => onOpenDetail(dataSource.dataSourceId)}
          aria-label={`${dataSource.fileName} 데이터 소스 상세 보기`}
          className="text-left transition-colors hover:text-orange-600 hover:underline focus-visible:rounded-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          {dataSource.fileName}
        </button>
      </td>
      <td className="py-16 text-gray-800">
        {formatFileSize(dataSource.fileSize)}
      </td>
      <td className="py-16 text-gray-800">
        {formatDateTime(dataSource.uploadedAt)}
      </td>
      <td
        className="py-16 pr-24 text-right"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onChat(dataSource)}
          disabled={chatDisabled}
          aria-label={`${dataSource.fileName} 분석 채팅 시작`}
          className="inline-flex items-center gap-4 rounded-full border border-gray-300 bg-white px-12 py-6 text-body4 text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
        >
          <ChatIcon aria-hidden className="icon-12 text-orange-500" />
          <span>{chatPending ? '시작 중' : '채팅'}</span>
        </button>
      </td>
    </tr>
  );
}
