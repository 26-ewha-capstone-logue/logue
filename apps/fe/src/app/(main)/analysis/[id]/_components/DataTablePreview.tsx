'use client';

export type DataTableColumn = {
  key: string;
  label: string;
};

export type DataTablePreviewProps = {
  columns?: DataTableColumn[];
  rows?: Record<string, string>[];
  className?: string;
};

const DEFAULT_COLUMNS: DataTableColumn[] = Array.from(
  { length: 6 },
  (_, i) => ({
    key: `col${i}`,
    label: '칼럼명 입력',
  }),
);

const DEFAULT_ROWS: Record<string, string>[] = Array.from(
  { length: 24 },
  () => {
    const row: Record<string, string> = {};
    DEFAULT_COLUMNS.forEach((col, idx) => {
      if (idx < 2) {
        row[col.key] = '30~40세';
      } else {
        row[col.key] = '칼럼이 길어지면 박스길이도 같이 길어집니다.';
      }
    });
    return row;
  },
);

export default function DataTablePreview({
  columns = DEFAULT_COLUMNS,
  rows = DEFAULT_ROWS,
  className = '',
}: DataTablePreviewProps) {
  return (
    <div
      className={`scrollbar-hide h-full overflow-auto ${className}`.trim()}
    >
      <table className="min-w-full border-collapse text-body4 text-gray-900">
        <thead className="sticky top-0 z-10">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="border-b border-gray-300 bg-orange-100 px-16 py-12 text-left font-medium whitespace-nowrap text-gray-900"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className="border-b border-gray-200 transition-colors hover:bg-orange-50"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-16 py-12 whitespace-nowrap text-gray-800"
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
