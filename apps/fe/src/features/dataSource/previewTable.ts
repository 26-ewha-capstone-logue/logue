import type { FilePreview } from '@/apis/datasource';

export type DataSourcePreviewColumn = {
  key: string;
  label: string;
};

export type DataSourcePreviewRow = Record<string, string>;

export type DataSourcePreviewTableModel = {
  columns: DataSourcePreviewColumn[];
  rows: DataSourcePreviewRow[];
};

export function createDataSourcePreviewTableModel(
  preview?: FilePreview | null,
): DataSourcePreviewTableModel | null {
  if (!preview || preview.headers.length === 0) return null;

  const columns = preview.headers.map((header, index) => ({
    key: `col-${index}`,
    label: header || `\uCEEC\uB7FC ${index + 1}`,
  }));
  const rows = preview.rows.map((row) =>
    columns.reduce<DataSourcePreviewRow>((acc, column, index) => {
      acc[column.key] = row[index] ?? '';
      return acc;
    }, {}),
  );

  return { columns, rows };
}
