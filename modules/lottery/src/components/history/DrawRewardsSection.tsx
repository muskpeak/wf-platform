"use client";

import React, { useState } from "react";
import { DrawRewardRecord } from "./types";
import { HistoryPagination } from "./HistoryPagination";

interface DrawRewardsSectionProps {
  ballCount?: number;
  currency?: string;
  rewards?: DrawRewardRecord[];
}

export function DrawRewardsSection({
  ballCount = 7,
  currency = "USDT",
  rewards: propRewards,
}: DrawRewardsSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Default mock rewards matching Figma design (node 1922:16223)
  const defaultRewards: DrawRewardRecord[] = [
    {
      id: "1",
      issue: "#1996",
      winningNumbers: ballCount === 3 ? "344" : "3441208",
      tier: "一等奖",
      amount: `105.00 ${currency}`,
      status: "待确认",
    },
    {
      id: "2",
      issue: "#1996",
      winningNumbers: ballCount === 3 ? "344" : "3441208",
      tier: "一等奖",
      amount: `105.00 ${currency}`,
      status: "待确认",
    },
    {
      id: "3",
      issue: "#1996",
      winningNumbers: ballCount === 3 ? "344" : "3441208",
      tier: "一等奖",
      amount: `105.00 ${currency}`,
      status: "待确认",
    },
    {
      id: "4",
      issue: "#1996",
      winningNumbers: ballCount === 3 ? "344" : "3441208",
      tier: "一等奖",
      amount: `105.00 ${currency}`,
      status: "待确认",
    },
    {
      id: "5",
      issue: "#1996",
      winningNumbers: ballCount === 3 ? "344" : "3441208",
      tier: "一等奖",
      amount: `105.00 ${currency}`,
      status: "待确认",
    },
  ];

  const rewards = propRewards || defaultRewards;

  return (
    <div className="bg-white border border-[#e7ebf4]/70 rounded-[26px] sm:rounded-[30px] p-4 sm:p-7 shadow-xs flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <h3 className="text-[18px] sm:text-[20px] font-bold text-[#18181b] leading-tight">
          开奖与奖金
        </h3>
        <p className="text-[11px] sm:text-[12px] text-[#707070]">
          PC 端用表格最清晰：时间、类型、关联订单、金额、状态、链上记录。
        </p>
      </div>

      {/* Inner Container */}
      <div className="bg-[#e7ebf4] rounded-[22px] sm:rounded-[24px] p-3 sm:p-5 flex flex-col gap-2.5 overflow-x-auto">
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-2 px-4 py-1 text-[12px] font-bold text-[#11181c] min-w-[480px]">
          <div>期号</div>
          <div className="text-center">中奖号码</div>
          <div className="text-center">类型</div>
          <div className="text-center">金额</div>
          <div className="text-right">状态</div>
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-2 min-w-[480px]">
          {rewards.map((row) => (
            <div
              key={row.id}
              className="bg-[#e7ebf4] hover:bg-[#dfe4ef] border border-[#f3f4f8] rounded-[14px] px-4 py-3 grid grid-cols-5 gap-2 items-center text-[12px] transition-colors"
            >
              <div className="font-medium text-[#18181b]">{row.issue}</div>
              <div className="text-center font-mono font-bold text-[#11181c] tracking-wider">
                {row.winningNumbers}
              </div>
              <div className="text-center text-[#11181c]">{row.tier}</div>
              <div className="text-center font-mono text-[#11181c]">{row.amount}</div>
              <div className="text-right text-[#11181c]">{row.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <HistoryPagination
        totalCount={1996}
        currentPage={currentPage}
        totalPages={200}
        onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
        onNext={() => setCurrentPage((p) => Math.min(200, p + 1))}
      />
    </div>
  );
}
