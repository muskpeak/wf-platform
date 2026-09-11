"use client";

import React from "react";
import { formatUnits } from "viem";

const COUNTRY_SLOTS = [
  { country: "美国", flag: "🇺🇸", slot: "第1位" },
  { country: "中国", flag: "🇨🇳", slot: "第2位" },
  { country: "德国", flag: "🇩🇪", slot: "第3位" },
  { country: "日本", flag: "🇯🇵", slot: "第4位" },
  { country: "英国", flag: "🇬🇧", slot: "第5位" },
  { country: "法国", flag: "🇫🇷", slot: "第6位" },
  { country: "意大利", flag: "🇮🇹", slot: "第7位" },
];

export interface PreviousIssueCardProps {
  roundId?: number;
  winningNumber?: number;
  totalSales?: bigint;
  cancelled?: boolean;
  drawStatus?: number;
  isLoading?: boolean;
}

export function PreviousIssueCard({
  roundId,
  winningNumber,
  totalSales,
  cancelled = false,
  drawStatus,
  isLoading = false,
}: PreviousIssueCardProps) {
  // 判定是否取消：链上标记 cancelled 或 drawStatus 为 4 (CANCELLED)
  const isCancelled = cancelled || drawStatus === 4;

  // 仅在未取消且开出有效非 0 号码时解析 7 位数字
  const hasWinningNumber = !isCancelled && winningNumber !== undefined && winningNumber > 0;
  const digits = hasWinningNumber
    ? String(winningNumber).padStart(7, "0").split("").map(Number)
    : Array(7).fill("-");

  const displayRoundId = roundId !== undefined ? roundId : "--";
  const displayPool =
    totalSales !== undefined ? formatUnits(totalSales, 6) : "0.00";

  return (
    <div className="bg-white rounded-[22px] p-5 md:p-6 border border-[#eef3fa] shadow-sm flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-[16px] font-bold text-[#0c0d10]">上期信息</h4>
          <p className="text-[10px] text-[#71717a] mt-0.5">
            上期中奖号码（第 {displayRoundId} 期{isCancelled ? " · 已取消" : ""}）
          </p>
        </div>
        {isCancelled ? (
          <span className="text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 px-2.5 py-0.5 rounded-full">
            已取消
          </span>
        ) : hasWinningNumber ? (
          <span className="text-[10px] font-bold bg-[#eef2ff] text-[#4F46E5] border border-[#c7d2fe] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
            已开奖
          </span>
        ) : null}
      </div>

      {/* 7 Digit Country Cards */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {COUNTRY_SLOTS.map((item, index) => (
          <div
            key={item.slot}
            className="bg-white border border-[#dce2ec] rounded-[18px] py-2 flex flex-col items-center justify-between gap-1 h-[115px] sm:h-[128px] overflow-hidden shadow-2xs"
          >
            <span className="text-[10px] text-[#64715f] font-medium truncate">
              {item.country}
            </span>

            {/* Flag emoji or circle badge */}
            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[18px] select-none bg-gray-50 border border-gray-100 shadow-2xs">
              {item.flag}
            </div>

            {/* Digit: 上期若取消或未开奖，严格展示 "-" */}
            <span className="font-mono font-bold text-[20px] sm:text-[24px] text-[#163300] leading-tight">
              {isLoading ? "..." : digits[index]}
            </span>

            {/* Line divider */}
            <div className="w-[20px] h-px bg-[#dce2ec]" />

            <span className="text-[9px] text-[#9aa6b2]">{item.slot}</span>
          </div>
        ))}
      </div>

      {/* Previous Pool */}
      <div className="pt-3 border-t border-[#f3f4f8] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-[#71717a]">上期奖池</span>
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] sm:text-[36px] font-extrabold font-mono text-[#303030] tracking-tight">
            {isLoading ? "..." : displayPool}
          </span>
          <span className="text-[14px] font-bold text-[#71717a] font-mono">
            USDT
          </span>
        </div>
      </div>
    </div>
  );
}
