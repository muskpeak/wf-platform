"use client";

import React from "react";

interface HistoryPaginationProps {
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
}

export function HistoryPagination({
  totalCount = 1996,
  currentPage = 1,
  totalPages = 200,
  onPrev,
  onNext,
  className = "",
}: HistoryPaginationProps) {
  return (
    <div className={`flex items-center justify-between pt-4 sm:pt-6 ${className}`}>
      <div className="text-[12px] text-[#71717a]">
        共 {totalCount} 条，第 {currentPage} / {totalPages} 页
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentPage <= 1}
          className="h-[30px] px-3.5 rounded-full border border-[#e4e4e7] bg-white text-[12px] text-[#18181b] font-medium hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
        >
          上一页
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={currentPage >= totalPages}
          className="h-[30px] px-3.5 rounded-full border border-[#e4e4e7] bg-white text-[12px] text-[#18181b] font-medium hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
        >
          下一页
        </button>
      </div>
    </div>
  );
}
