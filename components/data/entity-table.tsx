import Link from "next/link";
import { Card } from "@/components/ui/card";

export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

export function EntityTable<T extends { id: string }>({
  columns,
  rows,
  rowHref,
  emptyMessage = "Nothing here yet.",
}: {
  columns: Column<T>[];
  rows: T[];
  rowHref?: (row: T) => string;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <Card className="hidden overflow-hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/60">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.header}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const href = rowHref?.(row);
              return (
                <tr key={row.id} className="hover:bg-slate-50/70">
                  {columns.map((col, i) => (
                    <td key={col.header} className={col.className ?? "px-4 py-3"}>
                      {href && i === 0 ? (
                        <Link
                          href={href}
                          className="font-medium text-slate-900 hover:underline"
                        >
                          {col.cell(row)}
                        </Link>
                      ) : (
                        col.cell(row)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((row) => {
          const href = rowHref?.(row);
          const content = (
            <Card className="space-y-2 p-4">
              {columns.map((col, i) => (
                <div
                  key={col.header}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
                    {col.header}
                  </span>
                  <span
                    className={
                      i === 0 ? "font-medium text-slate-900" : "text-slate-600"
                    }
                  >
                    {col.cell(row)}
                  </span>
                </div>
              ))}
            </Card>
          );
          return href ? (
            <Link key={row.id} href={href} className="block">
              {content}
            </Link>
          ) : (
            <div key={row.id}>{content}</div>
          );
        })}
      </div>
    </>
  );
}
