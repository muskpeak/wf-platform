"use client";

import React, { useState } from "react";
import { DrawRewardRecord } from "./types";
import { HistoryPagination } from "./HistoryPagination";
import { ResponsiveTable, ResponsiveTableSkeleton, Empty } from "@wf-platform/uikit";
import { Trophy } from "lucide-react";

interface DrawRewardsSectionProps {
  ballCount?: number;
  currency?: string;
  rewards?: DrawRewardRecord[];
  loading?: boolean;
}

export function DrawRewardsSection({
  ballCount = 7,
  currency = "USDT",
  rewards: propRewards,
  loading = false,
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
      <div className="w-full">
        <ResponsiveTable<DrawRewardRecord>
          data={rewards}
          loading={loading}
          loadingState={<ResponsiveTableSkeleton pcColumns={5} pcRows={10} mobileRows={10} />}
          emptyState={
            <Empty
              icon={<Trophy className="w-12 h-12 stroke-[1]" />}
              title="暂无开奖数据"
              description="目前还没有历史开奖数据"
            />
          }
          rowKey="id"
          columns={[
            {
              key: "issue",
              header: "期号",
              align: "left",
              render: (value: any) => <span className="font-medium text-[#18181b]">{value as string}</span>,
            },
            {
              key: "winningNumbers",
              header: "中奖号码",
              align: "center",
              render: (value: any) => <span className="font-mono font-bold text-[#11181c] tracking-wider">{value as string}</span>,
            },
            {
              key: "tier",
              header: "类型",
              align: "center",
            },
            {
              key: "amount",
              header: "金额",
              align: "center",
              render: (value: any) => <span className="font-mono">{value as string}</span>,
            },
            {
              key: "status",
              header: "状态",
              align: "right",
            },
          ]}
        />
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
