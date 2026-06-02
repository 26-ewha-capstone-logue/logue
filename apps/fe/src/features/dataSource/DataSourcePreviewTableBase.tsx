import type { DataSourcePreviewTableModel } from './previewTable';

type DataSourcePreviewTableBaseProps = {
  bodyWrapperClassName?: string;
  cellClassName: string;
  headerClassName: string;
  headerRowClassName?: string;
  rowClassName: string;
  rowEmptyMessage: string;
  showCellTitle?: boolean;
  table: DataSourcePreviewTableModel;
  theadClassName?: string;
};

export function DataSourcePreviewTableBase({
  bodyWrapperClassName,
  cellClassName,
  headerClassName,
  headerRowClassName,
  rowClassName,
  rowEmptyMessage,
  showCellTitle = false,
  table,
  theadClassName,
}: DataSourcePreviewTableBaseProps) {
  return (
    <div className={bodyWrapperClassName}>
      <table className="min-w-full border-collapse text-body4">
        <thead className={theadClassName}>
          <tr className={headerRowClassName}>
            {table.columns.map((column) => (
              <th key={column.key} className={headerClassName}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.length === 0 ? (
            <tr>
              <td
                colSpan={table.columns.length}
                className="px-16 py-32 text-center text-gray-600"
              >
                {rowEmptyMessage}
              </td>
            </tr>
          ) : (
            table.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowClassName}>
                {table.columns.map((column) => {
                  const cell = row[column.key] || '-';

                  return (
                    <td
                      key={column.key}
                      className={cellClassName}
                      title={showCellTitle ? cell : undefined}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
