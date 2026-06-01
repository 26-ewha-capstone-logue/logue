import type { DataSourceSummary } from '@/features/dataSource';
import { Checkbox } from '@/components';
import DataSourceRow from './DataSourceRow';

type DataSourceTableProps = {
  allSelected: boolean;
  chatDisabled: boolean;
  chatPendingDataSourceId: number | null;
  dataSources: DataSourceSummary[];
  onChat: (dataSource: DataSourceSummary) => void;
  onOpenDetail: (id: number) => void;
  onToggleAll: () => void;
  onToggleOne: (id: number) => void;
  partiallySelected: boolean;
  selectedVisibleIds: ReadonlySet<number>;
  tableMessage: string | null;
};

export default function DataSourceTable({
  allSelected,
  chatDisabled,
  chatPendingDataSourceId,
  dataSources,
  onChat,
  onOpenDetail,
  onToggleAll,
  onToggleOne,
  partiallySelected,
  selectedVisibleIds,
  tableMessage,
}: DataSourceTableProps) {
  return (
    <div className="overflow-hidden rounded-12 border border-gray-300 bg-white">
      <table className="w-full border-collapse text-body4">
        <thead>
          <tr className="bg-gray-200 text-gray-900">
            <th className="w-[5.6rem] py-16 pl-24 text-left">
              <Checkbox
                size="md"
                checked={allSelected}
                indeterminate={partiallySelected}
                onCheckedChange={onToggleAll}
                aria-label="데이터 소스 전체 선택"
              />
            </th>
            <th className="py-16 text-left font-semibold">파일명</th>
            <th className="w-[14rem] py-16 text-left font-semibold">
              파일 크기
            </th>
            <th className="w-[16rem] py-16 text-left font-semibold">
              최근 업로드
            </th>
            <th className="w-[14rem] py-16 pr-24 text-right font-semibold">
              액션
            </th>
          </tr>
        </thead>
        <tbody>
          {tableMessage ? (
            <tr>
              <td colSpan={5} className="px-24 py-40 text-center text-gray-600">
                {tableMessage}
              </td>
            </tr>
          ) : (
            dataSources.map((dataSource) => (
              <DataSourceRow
                key={dataSource.dataSourceId}
                checked={selectedVisibleIds.has(dataSource.dataSourceId)}
                chatDisabled={chatDisabled}
                chatPending={
                  chatPendingDataSourceId === dataSource.dataSourceId
                }
                dataSource={dataSource}
                onChat={onChat}
                onOpenDetail={onOpenDetail}
                onToggle={onToggleOne}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
