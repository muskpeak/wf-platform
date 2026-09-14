import React from "react";
import { Skeleton } from "../../ui/Skeleton";

export interface ResponsiveTableSkeletonProps {
  /**
   * Number of columns to show in the Desktop skeleton.
   * Default is 5.
   */
  pcColumns?: number;
  /**
   * Number of rows to show in the Desktop skeleton.
   * Default is 5.
   */
  pcRows?: number;
  /**
   * Number of cards to show in the Mobile skeleton.
   * Default is 3.
   */
  mobileRows?: number;
}

export function ResponsiveTableSkeleton({
  pcColumns = 5,
  pcRows = 5,
  mobileRows = 3,
}: ResponsiveTableSkeletonProps) {
  return (
    <div className="w-full">
      {/* Desktop Skeleton View */}
      <div className="hidden lg:block w-full border border-[#e4e4e7] rounded-[16px] overflow-hidden bg-white shadow-2xs mt-4">
        {/* Header */}
        <div className="flex items-center w-full bg-zinc-50 border-b border-[#e4e4e7] h-[48px] px-6">
          {Array.from({ length: pcColumns }).map((_, colIdx) => (
            <div key={`header-${colIdx}`} className="flex-1 mr-4 last:mr-0">
              <Skeleton className="h-4 w-1/2 max-w-[100px]" />
            </div>
          ))}
        </div>
        
        {/* Rows */}
        <div className="divide-y divide-[#e4e4e7]">
          {Array.from({ length: pcRows }).map((_, rowIdx) => (
            <div key={`row-${rowIdx}`} className="flex items-center w-full bg-white h-[64px] px-6">
              {Array.from({ length: pcColumns }).map((_, colIdx) => (
                <div key={`col-${rowIdx}-${colIdx}`} className="flex-1 mr-4 last:mr-0">
                  <Skeleton className="h-4 w-3/4 max-w-[120px]" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Skeleton View */}
      <div className="block lg:hidden w-full space-y-3 mt-4">
        {Array.from({ length: mobileRows }).map((_, rowIdx) => (
          <div
            key={`mobile-row-${rowIdx}`}
            className="w-full bg-white border border-[#e4e4e7] rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          >
            {/* Top row: typically an ID or summary + Status */}
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-5 w-[140px]" />
              <Skeleton className="h-5 w-[60px]" />
            </div>

            {/* Content rows */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-[70px]" />
                <Skeleton className="h-4 w-[90px]" />
              </div>
            </div>

            {/* Bottom action row */}
            <div className="mt-4 pt-3 border-t border-zinc-100 flex justify-end">
              <Skeleton className="h-8 w-[80px] rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
