import type { ReactNode } from "react";

interface Column<T extends object> {
  key: keyof T;
  label: string;
  align?: "left" | "right";
  render?: (value: T[keyof T], row: T) => ReactNode;
}

interface DataTableProps<T extends object> {
  columns: Column<T>[];
  rows: T[];
  limit?: number;
  showRank?: boolean;
  rankLabel?: string;
  rankStart?: number;
  emptyLabel?: string;
}

export function DataTable<T extends object>({
  columns,
  rows,
  limit,
  showRank = false,
  rankLabel = "#",
  rankStart = 1,
  emptyLabel = "No data available."
}: DataTableProps<T>) {
  const visible = limit ? rows.slice(0, limit) : rows;

  if (!visible.length) {
    return <p className="empty">{emptyLabel}</p>;
  }

  return (
    <div className="table">
      <table>
        <thead>
          <tr>
            {showRank && <th className="align-right">{rankLabel}</th>}
            {columns.map(column => (
              <th key={String(column.key)} className={column.align === "right" ? "align-right" : ""}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${String(row[columns[0].key])}`}>
              {showRank && <td className="table__rank align-right">{rowIndex + rankStart}</td>}
              {columns.map(column => (
                <td key={String(column.key)} className={column.align === "right" ? "align-right" : ""}>
                  {column.render
                    ? column.render(row[column.key], row)
                    : String(row[column.key] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
