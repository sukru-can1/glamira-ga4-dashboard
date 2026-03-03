"use client";

import { useState, useMemo } from "react";

interface Column {
  key: string;
  label: string;
  format?: (value: string) => string;
  align?: "left" | "right";
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, string>[];
  defaultSortKey?: string;
  defaultSortDesc?: boolean;
  pageSize?: number;
}

export function DataTable({ columns, rows, defaultSortKey, defaultSortDesc = true, pageSize = 25 }: DataTableProps) {
  const [sortKey, setSortKey] = useState(defaultSortKey ?? columns[0]?.key);
  const [sortDesc, setSortDesc] = useState(defaultSortDesc);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const aVal = Number(a[sortKey]) || 0;
      const bVal = Number(b[sortKey]) || 0;
      return sortDesc ? bVal - aVal : aVal - bVal;
    });
  }, [rows, sortKey, sortDesc]);

  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(rows.length / pageSize);

  function toggleSort(key: string) {
    if (key === sortKey) setSortDesc(!sortDesc);
    else { setSortKey(key); setSortDesc(true); }
    setPage(0);
  }

  function exportCSV() {
    const header = columns.map((c) => c.label).join(",");
    const body = sorted.map((row) => columns.map((c) => `"${row[c.key] ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-gray-400">{rows.length} rows{totalPages > 1 && ` · Page ${page + 1} of ${totalPages}`}</p>
        <button onClick={exportCSV} className="text-xs text-blue-600 hover:text-blue-800">Export CSV</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              {columns.map((col) => (
                <th key={col.key} onClick={() => toggleSort(col.key)} className={`cursor-pointer pb-2 pr-4 hover:text-gray-700 ${col.align === "right" ? "text-right" : ""}`}>
                  {col.label}{sortKey === col.key && <span className="ml-1">{sortDesc ? "↓" : "↑"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i} className="border-b border-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className={`py-1.5 pr-4 ${col.align === "right" ? "text-right" : ""}`}>
                    {col.format ? col.format(row[col.key] ?? "") : row[col.key] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-3 flex items-center gap-2">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="rounded border px-2 py-1 text-xs disabled:opacity-30">Prev</button>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="rounded border px-2 py-1 text-xs disabled:opacity-30">Next</button>
        </div>
      )}
    </div>
  );
}
