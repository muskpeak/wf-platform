import React, { useMemo } from "react";
import { ResponsiveTableProps } from "./types";
import { DesktopTable } from "./DesktopTable";
import { MobileCardList } from "./MobileCardList";

export function ResponsiveTable<T>({
  data,
  columns,
  rowKey,
  loading,
  loadingState,
  emptyState,
  error,
  errorState,
  emptyText = "暂无数据",
  className = "",
  rowClassName,
}: ResponsiveTableProps<T>) {
  const getRowKey = useMemo(() => {
    if (typeof rowKey === "function") {
      return rowKey;
    }
    return (record: T, index: number) => {
      const key = (record as any)[rowKey];
      if (key === undefined || key === null) {
        return index;
      }
      return key;
    };
  }, [rowKey]);

  if (loading) {
    if (loadingState) return loadingState;
    // Default loading fallback
    return (
      <div className="flex justify-center items-center py-20 text-sm text-[#9aa6b2]">
        <div className="w-5 h-5 border-2 border-[#9aa6b2]/30 border-t-[#9aa6b2] rounded-full animate-spin mr-2"></div>
        加载中...
      </div>
    );
  }

  if (error) {
    if (errorState) return errorState;
    return (
      <div className="flex justify-center items-center py-20 text-sm text-red-500">
        加载失败，请重试
      </div>
    );
  }

  if (!data || data.length === 0) {
    if (emptyState) return emptyState;
    // Desktop and Mobile generic fallback is handled inside DesktopTable and MobileCardList by passing emptyText
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop View */}
      <div className="hidden lg:block">
        <DesktopTable data={data} columns={columns} getRowKey={getRowKey} emptyText={emptyText} rowClassName={rowClassName} />
      </div>

      {/* Mobile View */}
      <div className="block lg:hidden">
        <MobileCardList data={data} columns={columns} getRowKey={getRowKey} emptyText={emptyText} rowClassName={rowClassName} />
      </div>
    </div>
  );
}
