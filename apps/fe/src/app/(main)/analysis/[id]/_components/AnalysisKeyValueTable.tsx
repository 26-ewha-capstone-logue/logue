import type { Key, ReactNode } from 'react';
import {
  AnalysisTable,
  AnalysisTableCell,
  AnalysisTableHeaderCell,
  AnalysisTableRow,
} from './AnalysisTable';

const KEY_COLUMN_WIDTH_CLASS = 'w-[14rem]';

export type AnalysisKeyValueTableRow = {
  cellClassNames?: readonly [string?, string?];
  cells: readonly [ReactNode, ReactNode];
  key: Key;
};

type AnalysisKeyValueTableProps = {
  emptyContent?: ReactNode;
  headers: [ReactNode, ReactNode];
  headerRowClassName?: string;
  rows: AnalysisKeyValueTableRow[];
  tableClassName?: string;
};

export default function AnalysisKeyValueTable({
  emptyContent,
  headers,
  headerRowClassName,
  rows,
  tableClassName,
}: AnalysisKeyValueTableProps) {
  return (
    <AnalysisTable tableClassName={tableClassName}>
      <thead>
        <tr className={headerRowClassName}>
          <AnalysisTableHeaderCell className={KEY_COLUMN_WIDTH_CLASS}>
            {headers[0]}
          </AnalysisTableHeaderCell>
          <AnalysisTableHeaderCell>{headers[1]}</AnalysisTableHeaderCell>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <AnalysisTableCell
              colSpan={2}
              className="text-center text-gray-600"
            >
              {emptyContent}
            </AnalysisTableCell>
          </tr>
        ) : (
          rows.map((row) => (
            <AnalysisTableRow key={row.key}>
              <AnalysisTableCell className={row.cellClassNames?.[0] ?? ''}>
                {row.cells[0]}
              </AnalysisTableCell>
              <AnalysisTableCell className={row.cellClassNames?.[1] ?? ''}>
                {row.cells[1]}
              </AnalysisTableCell>
            </AnalysisTableRow>
          ))
        )}
      </tbody>
    </AnalysisTable>
  );
}
