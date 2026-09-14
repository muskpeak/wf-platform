import React from "react";
import { Column } from "./types";

interface DesktopTableProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowKey: (record: T, index: number) => string | number;
  emptyText?: string;
  rowClassName?: (record: T, index: number) => string;
}

export function DesktopTable<T>({ data, columns, getRowKey, emptyText = "暂无数据", rowClassName }: DesktopTableProps<T>) {
  const visibleColumns = columns.filter((col) => col.showOnDesktop !== false);

  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center py-20 text-sm text-[#9aa6b2]">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="w-full rounded-[18px] sm:rounded-[20px] border border-[#e7ebf4]/70 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f0f3f9] text-[#707070] text-[13px] sm:text-sm whitespace-nowrap border-b border-[#e7ebf4]">
              {visibleColumns.map((col) => (
                <th key={col.key} className={`py-3 sm:py-4 px-4 sm:px-6 font-medium ${col.headerClassName || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((record, index) => {
              const key = getRowKey(record, index);
              const customClass = rowClassName ? rowClassName(record, index) : "";
              return (
                <tr key={key} className={`border-b border-[#e7ebf4]/50 hover:bg-[#f8f9fc]/50 transition-colors ${customClass || "bg-white"}`}>
                  {visibleColumns.map((col) => (
                    <td key={col.key} className={`py-3 sm:py-4 px-4 sm:px-6 text-sm text-gray-900 whitespace-nowrap ${col.className || ""}`}>
                      {col.render(record, index)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
