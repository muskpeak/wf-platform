import React from "react";
import { Column } from "./types";

interface MobileCardListProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowKey: (record: T, index: number) => string | number;
  emptyText?: string;
  rowClassName?: (record: T, index: number) => string;
}

export function MobileCardList<T>({ data, columns, getRowKey, emptyText = "暂无数据", rowClassName }: MobileCardListProps<T>) {
  // Filter columns meant for mobile
  let visibleColumns = columns.filter((col) => col.showOnMobile !== false);

  // Sort by mobileOrder if provided
  visibleColumns = [...visibleColumns].sort((a, b) => {
    const orderA = a.mobileOrder ?? 999;
    const orderB = b.mobileOrder ?? 999;
    return orderA - orderB;
  });

  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center py-20 text-sm text-[#9aa6b2]">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {data.map((record, index) => {
        const key = getRowKey(record, index);
        const customClass = rowClassName ? rowClassName(record, index) : "";
        
        // Find primary columns (like Title / Status) to put in a header area
        const primaryCols = visibleColumns.filter(c => c.mobilePrimary);
        const secondaryCols = visibleColumns.filter(c => !c.mobilePrimary);

        return (
          <div key={key} className={`bg-white rounded-xl border border-[#e7ebf4]/70 p-4 shadow-sm flex flex-col gap-3 ${customClass}`}>
            {primaryCols.length > 0 && (
              <div className="flex justify-between items-center pb-3 border-b border-[#f0f3f9]">
                {primaryCols.map((col, idx) => (
                  <div key={col.key} className={idx === 0 ? "font-semibold text-gray-900" : ""}>
                    {col.render(record, index)}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex flex-col gap-2.5">
              {secondaryCols.map((col) => {
                // If there's no header (like an action column), render it full width, otherwise key-value
                if (!col.header) {
                  return (
                    <div key={col.key} className={`text-sm ${col.className || ""}`}>
                      {col.render(record, index)}
                    </div>
                  );
                }
                
                return (
                  <div key={col.key} className="flex justify-between items-center">
                    <span className="text-sm text-[#707070] shrink-0 mr-4">{col.header}</span>
                    <div className={`text-sm text-gray-900 text-right break-all ${col.className || ""}`}>
                      {col.render(record, index)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
