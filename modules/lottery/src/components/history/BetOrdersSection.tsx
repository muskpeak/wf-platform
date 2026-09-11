"use client";

import React, { useState } from "react";
import { BetOrderRecord, HistoryStats } from "./types";
import { HistoryPagination } from "./HistoryPagination";

interface BetOrdersSectionProps {
  ballCount?: number;
  currency?: string;
  currentIssue?: string;
  stats?: HistoryStats;
  orders?: BetOrderRecord[];
}

export function BetOrdersSection({
  ballCount = 7,
  currency = "USDT",
  currentIssue = "2450",
  stats,
  orders: propOrders,
}: BetOrdersSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Default mock orders matching Figma design (supports 7 digits for World, 3 digits for 3D)
  const defaultOrders: BetOrderRecord[] = [
    {
      id: "1",
      issue: "#1996",
      numbers: ballCount === 3 ? "775" : "7753920",
      multiplier: 61,
      amount: `100${currency}`,
      time: "04/13 09:43",
      status: "待开奖",
      isWin: false,
    },
    {
      id: "2",
      issue: "#1996",
      numbers: ballCount === 3 ? "392" : "3928104",
      multiplier: 61,
      amount: `100${currency}`,
      time: "04/13 09:43",
      status: "待开奖",
      isWin: false,
    },
    {
      id: "3",
      issue: "#1996",
      numbers: ballCount === 3 ? "390" : "3901245",
      multiplier: 61,
      amount: `100${currency}`,
      time: "04/13 09:43",
      status: "待开奖",
      isWin: false,
    },
    {
      id: "4",
      issue: "#2032",
      numbers: ballCount === 3 ? "770" : "7709812",
      multiplier: 61,
      amount: `100${currency}`,
      time: "04/13 09:43",
      status: "已中奖",
      isWin: true,
    },
  ];

  const orders = propOrders || defaultOrders;

  const statItems = [
    {
      label: `本期投注-第 ${stats?.currentIssue || currentIssue} 期`,
      value: (
        <span className="flex items-baseline gap-1">
          <span className="font-mono font-bold text-[20px] text-[#303030]">
            {stats?.currentBetAmount || "38.00"}
          </span>
          <span className="font-bold text-[10px] text-[#303030]">{currency}</span>
        </span>
      ),
      note: stats?.currentBetDetail || "4 组号码 · 38 倍",
    },
    {
      label: "待开奖订单",
      value: (
        <span className="font-bold text-[20px] text-[#303030]">
          {stats?.pendingOrdersCount ?? "1 笔"}
        </span>
      ),
      note: stats?.pendingOrdersNote || "第 WLT-2032 期",
    },
    {
      label: "已完成订单",
      value: (
        <span className="font-bold text-[20px] text-[#303030]">
          {stats?.completedOrdersCount ?? "12 笔"}
        </span>
      ),
      note: stats?.completedOrdersNote || "历史订单都在这里",
    },
    {
      label: "异常订单",
      value: (
        <span className="font-bold text-[20px] text-[#303030]">
          {stats?.errorOrdersCount ?? "0 笔"}
        </span>
      ),
      note: stats?.errorOrdersNote || "无出票失败",
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 4 Stats Header Row - 1:1 matching Figma node 1922:16173 */}
      <div className="flex items-center justify-between w-full py-1">
        {statItems.map((item, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <div className="h-[48px] sm:h-[54px] w-px bg-[#e7ebf4] shrink-0" />}
            <div className="flex flex-col gap-1 shrink-0">
              <span className="text-[10px] sm:text-[11px] text-[#707070] font-medium leading-none whitespace-nowrap">
                {item.label}
              </span>
              <div className="leading-tight my-0.5">{item.value}</div>
              <span className="text-[9.5px] sm:text-[10px] text-[rgba(112,112,112,0.5)] leading-none whitespace-nowrap">
                {item.note}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-[#e7ebf4]/70 rounded-[26px] sm:rounded-[30px] p-4 sm:p-7 shadow-xs flex flex-col gap-5">
        {/* Card Header */}
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[18px] sm:text-[20px] font-bold text-[#18181b] leading-tight">
            投注订单
          </h3>
          <p className="text-[11px] sm:text-[12px] text-[#707070]">
            表格适合 PC：期号、号码、金额、状态、操作一屏可比对。
          </p>
        </div>

        {/* Orders Table Container */}
        <div className="w-full rounded-[18px] sm:rounded-[20px] border border-[#e7ebf4]/70 overflow-hidden">
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="bg-[#e7ebf4] h-[44px] text-[#303030] text-[11px] sm:text-[12px] font-bold">
                <th className="w-[17%] px-2 sm:px-3 py-2">期号</th>
                <th className="w-[24%] px-1 sm:px-2 py-2 text-center">投注号码</th>
                <th className="w-[11%] px-1 py-2 text-center">倍数</th>
                <th className="w-[19%] px-1 sm:px-2 py-2 text-center">金额</th>
                <th className="w-[18%] px-1 py-2 text-center">出票时间</th>
                <th className="w-[11%] px-1 sm:px-2 py-2 text-right">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7ebf4]/60 text-[11px] sm:text-[12px]">
              {orders.map((order) => {
                const isWin = order.isWin || order.status === "已中奖";
                const rowTextColor = isWin ? "text-[#008cff]" : "text-[#4b5767]";

                return (
                  <tr
                    key={order.id}
                    className={`hover:bg-[#fbfcfe] transition-colors ${
                      isWin ? "bg-[#008cff]/4" : ""
                    }`}
                  >
                    <td className={`px-2 sm:px-3 py-3 font-medium whitespace-nowrap ${rowTextColor}`}>
                      {order.issue}
                    </td>
                    <td className={`px-1 sm:px-2 py-3 text-center font-mono font-bold tracking-tight whitespace-nowrap text-[11px] sm:text-[12px] ${rowTextColor}`}>
                      {order.numbers}
                    </td>
                    <td className={`px-1 py-3 text-center whitespace-nowrap ${rowTextColor}`}>
                      {order.multiplier}x
                    </td>
                    <td className={`px-1 sm:px-2 py-3 text-center font-mono whitespace-nowrap text-[10.5px] sm:text-[11.5px] ${rowTextColor}`}>
                      {order.amount}
                    </td>
                    <td className={`px-1 py-3 text-center whitespace-nowrap text-[9.5px] sm:text-[10.5px] ${rowTextColor}`}>
                      {order.time}
                    </td>
                    <td className="px-1 sm:px-2 py-3 text-right font-medium whitespace-nowrap">
                      <span
                        className={
                          isWin ? "text-[#008cff] font-bold" : "text-[#71717a]"
                        }
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
    </div>
  );
}
