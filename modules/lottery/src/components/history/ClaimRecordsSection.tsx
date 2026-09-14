"use client";

import React, { useState } from "react";
import { ClaimRecord } from "./types";
import { HistoryPagination } from "./HistoryPagination";
import { Skeleton, Empty } from "@wf-platform/uikit";
import { PackageOpen } from "lucide-react";

interface ClaimRecordsSectionProps {
  ballCount?: number;
  currency?: string;
  claims?: ClaimRecord[];
  onClaim?: (recordId: string) => void;
  loading?: boolean;
}

export function ClaimRecordsSection({
  ballCount = 7,
  currency = "USDT",
  claims: propClaims,
  onClaim,
  loading = false,
}: ClaimRecordsSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Default mock claim records matching Figma design (supports 7 balls or 3 balls)
  const defaultClaims: ClaimRecord[] = [
    {
      id: "claim-1",
      issue: "#2032 期开奖号",
      balls: ballCount === 3 ? [9, 7, 8] : [9, 7, 8, 2, 4, 1, 5],
      tier: "二等奖",
      amount: `100 ${currency}`,
      isClaimed: true,
    },
    {
      id: "claim-2",
      issue: "#2031 期开奖号",
      balls: ballCount === 3 ? [6, 1, 8] : [6, 1, 8, 3, 0, 7, 2],
      tier: "三等奖",
      amount: `4500 ${currency}`,
      isClaimed: false,
    },
  ];

  const [claimList, setClaimList] = useState<ClaimRecord[]>(propClaims || defaultClaims);

  const handleClaim = (id: string) => {
    setClaimList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isClaimed: true } : item))
    );
    if (onClaim) {
      onClaim(id);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="bg-white border border-[#e7ebf4]/70 rounded-[22px] sm:rounded-[26px] p-4 sm:p-5 shadow-xs flex flex-col gap-3.5"
            >
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-12 w-full rounded-[18px]" />
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-9 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && claimList.length === 0 && (
        <Empty 
          icon={<PackageOpen className="w-12 h-12 stroke-[1]" />}
          title="暂无领奖记录"
          description="您还没有相关的领奖历史"
        />
      )}

      {/* List of Claim Cards */}
      {!loading && claimList.length > 0 && (
        <div className="flex flex-col gap-4">
          {claimList.map((record) => (
            <div
              key={record.id}
              className="bg-white border border-[#e7ebf4]/70 rounded-[22px] sm:rounded-[26px] p-4 sm:p-5 shadow-xs flex flex-col gap-3.5"
            >
              {/* Card Title */}
              <h4 className="font-bold text-[18px] text-[#0c0d10] leading-none">
                {record.issue}
              </h4>

            {/* Ball Pill Capsule Container */}
            <div className="bg-[#edf0f8] rounded-[18px] px-3.5 py-2.5 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              {record.balls.map((digit, idx) => (
                <div
                  key={idx}
                  className="size-[34px] sm:size-[38px] bg-white rounded-full flex items-center justify-center font-mono font-bold text-[17px] sm:text-[18px] text-[#163300] shadow-2xs select-none transition-transform hover:scale-105"
                >
                  {digit}
                </div>
              ))}
            </div>

            {/* Prize Amount & Action Row */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3 sm:gap-5">
                <span className="text-[12px] sm:text-[13px] font-medium text-[#71717a]">
                  {record.tier}
                </span>
                <span className="font-mono font-bold text-[19px] sm:text-[20px] text-[#475767]">
                  {record.amount}
                </span>
              </div>

              <div>
                {record.isClaimed ? (
                  <button
                    type="button"
                    disabled
                    className="h-[36px] px-6 sm:px-8 rounded-full bg-[#dbdbdb] text-[#686868] text-[14px] font-bold cursor-default select-none flex items-center justify-center"
                  >
                    已领取
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleClaim(record.id)}
                    className="h-[36px] px-6 sm:px-8 rounded-full bg-[#fff4e7] border border-[#ffe1c2] text-[#f59e0b] hover:bg-[#ffe7ba] text-[14px] font-bold transition-all active:scale-95 cursor-pointer shadow-xs flex items-center justify-center"
                  >
                    领取
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Pagination */}
      <div className="bg-white border border-[#e7ebf4]/70 rounded-[20px] px-4 py-2 shadow-2xs">
        <HistoryPagination
          totalCount={1996}
          currentPage={currentPage}
          totalPages={200}
          onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNext={() => setCurrentPage((p) => Math.min(200, p + 1))}
        />
      </div>
    </div>
  );
}
