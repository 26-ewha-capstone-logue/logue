import type {
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';

type AnalysisTableProps = {
  children: ReactNode;
  className?: string;
  tableClassName?: string;
} & Omit<TableHTMLAttributes<HTMLTableElement>, 'className'>;

export function AnalysisTable({
  children,
  className = '',
  tableClassName = 'text-body2',
  ...props
}: AnalysisTableProps) {
  return (
    <div
      className={`overflow-hidden rounded-12 border border-gray-300 ${className}`.trim()}
    >
      <table
        className={`w-full border-collapse ${tableClassName}`.trim()}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function AnalysisTableHeaderCell({
  children,
  className = '',
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`border-b border-gray-300 px-16 py-12 text-left font-semibold text-gray-900 ${className}`.trim()}
      {...props}
    >
      {children}
    </th>
  );
}

export function AnalysisTableRow({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={`border-b border-gray-200 last:border-b-0 ${className}`.trim()}
    >
      {children}
    </tr>
  );
}

export function AnalysisTableCell({
  children,
  className = '',
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-16 py-12 ${className}`.trim()} {...props}>
      {children}
    </td>
  );
}
