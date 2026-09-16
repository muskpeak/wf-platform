"use client";

import React, { useState } from "react";
import { BetOrderRecord, HistoryStats } from "./types";
import { HistoryPagination } from "./HistoryPagination";
import { RotateCcw, PackageOpen } from "lucide-react";
import { ResponsiveTable, ResponsiveTableSkeleton, Empty } from "@wf-platform/uikit";

interface BetOrdersSectionProps {
  ballCount?: number;
  currency?: string;
  currentIssue?: string;
  stats?: HistoryStats;
  orders?: BetOrderRecord[];
  onClaim?: (recordId: string) => void;
  onRefund?: (recordId: string) => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
}

export function BetOrdersSection({
  ballCount = 7,
  currency = "WUSD",
  currentIssue = "104191",
  stats,
  orders: propOrders,
  onClaim,
  onRefund,
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  loading = false,
}: BetOrdersSectionProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const orders = propOrders;

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
      {/* <div className="flex items-center justify-between w-full py-1">
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
      </div> */}

      {/* Main Table Card */}
      <div className="bg-white border border-[#e7ebf4]/70 rounded-[26px] sm:rounded-[30px] p-4 sm:p-7 shadow-xs flex flex-col gap-5">
        {/* Card Header */}
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[18px] sm:text-[20px] font-bold text-[#18181b] leading-tight">
            投注订单
          </h3>
          <p className="text-[11px] sm:text-[12px] text-[#707070]">
            历史订单都在这里
          </p>
        </div>

        {/* Orders Table Container */}
        <ResponsiveTable<BetOrderRecord>
          data={orders || []}
          loading={loading}
          loadingState={<ResponsiveTableSkeleton pcColumns={6} pcRows={10} mobileRows={10} />}
          emptyState={
            <Empty
              icon={<PackageOpen className="w-12 h-12 stroke-[1]" />}
              title="暂无下注记录"
              description="您还没有相关的下注历史，快去体验一下吧！"
            />
          }
          rowKey="id"
          columns={[
            {
              key: "issue",
              header: "期号",
              mobilePrimary: true,
              mobileOrder: 1,
              className: "font-medium",
              render: (order: BetOrderRecord) => {
                const isWin = order.isWin || order.status === "已中奖";
                const isCancelled = order.status === "已取消";
                const rowTextColor = isWin ? "text-[#008cff]" : isCancelled ? "text-[#a1a1aa]" : "text-[#4b5767]";
                return <span className={rowTextColor}>{order.issue}</span>;
              }
            },
            {
              key: "ticketId",
              header: "票据",
              mobilePrimary: true,
              mobileOrder: 2,
              className: "text-center md:text-left",
              headerClassName: "text-center md:text-left",
              render: (order: BetOrderRecord) => {
                const isWin = order.isWin || order.status === "已中奖";
                const isCancelled = order.status === "已取消";
                const rowTextColor = isWin ? "text-[#008cff]" : isCancelled ? "text-[#a1a1aa]" : "text-[#4b5767]";
                return <span className={`font-mono font-bold tracking-tight text-[11px] sm:text-[12px] ${rowTextColor}`}>#{order.ticketId || order.id}</span>;
              }
            },
            {
              key: "numbers",
              header: "投注号码",
              mobileOrder: 3,
              className: "text-center md:text-left",
              headerClassName: "text-center md:text-left",
              render: (order: BetOrderRecord) => {
                const isWin = order.isWin || order.status === "已中奖";
                const isCancelled = order.status === "已取消";
                const rowTextColor = isWin ? "text-[#008cff]" : isCancelled ? "text-[#a1a1aa]" : "text-[#4b5767]";
                return <span className={`font-mono font-bold tracking-tight text-[11px] sm:text-[12px] ${rowTextColor}`}>{order.numbers}</span>;
              }
            },
            {
              key: "winningNumber",
              header: "开奖号码",
              mobileOrder: 4,
              className: "text-center md:text-left",
              headerClassName: "text-center md:text-left",
              render: (order: BetOrderRecord) => {
                const isWin = order.isWin || order.status === "已中奖";
                const isCancelled = order.status === "已取消";
                const rowTextColor = isWin ? "text-[#008cff]" : isCancelled ? "text-[#a1a1aa]" : "text-[#4b5767]";
                return <span className={`font-mono font-bold tracking-tight text-[11px] sm:text-[12px] ${rowTextColor}`}>{order.winningNumber || "—"}</span>;
              }
            },
            ...(ballCount === 7 ? [{
              key: "multiplier",
              header: "倍数",
              mobileOrder: 5,
              className: "text-center",
              headerClassName: "text-center",
              render: (order: BetOrderRecord) => {
                const isWin = order.isWin || order.status === "已中奖";
                const isCancelled = order.status === "已取消";
                const rowTextColor = isWin ? "text-[#008cff]" : isCancelled ? "text-[#a1a1aa]" : "text-[#4b5767]";
                return <span className={rowTextColor}>{order.multiplier}x</span>;
              }
            }] : []),

            {
              key: "prize",
              header: "奖金",
              mobileOrder: 6,
              className: "text-center",
              headerClassName: "text-center",
              render: (order: BetOrderRecord) => {
                const isWin = Boolean(order.isWin || order.status === "已中奖" || order.status === "中奖 · 待领取");
                const isCancelled = order.status === "已取消";
                const rowTextColor = isWin ? "text-[#008cff] font-bold" : isCancelled ? "text-[#a1a1aa]" : "text-[#4b5767]";
                return <span className={`font-mono text-[10.5px] sm:text-[12px] ${rowTextColor}`}>{order.prize || "0 USD"}</span>;
              }
            },
            {
              key: "time",
              header: "出票时间",
              mobileOrder: 8,
              className: "text-center",
              headerClassName: "text-center",
              render: (order: BetOrderRecord) => {
                const isWin = Boolean(order.isWin || order.status === "已中奖" || order.status === "中奖 · 待领取");
                const isCancelled = order.status === "已取消";
                const rowTextColor = isWin ? "text-[#008cff]" : isCancelled ? "text-[#a1a1aa]" : "text-[#4b5767]";
                return <span className={`text-[9.5px] sm:text-[10.5px] ${rowTextColor}`}>{order.time}</span>;
              }
            },
            {
              key: "status",
              header: "状态",
              mobileOrder: 9,
              className: "text-center",
              headerClassName: "text-center",
              render: (order: BetOrderRecord) => {
                const s = order.status;
                let bg = "bg-slate-50";
                let border = "border-slate-200";
                let text = "text-slate-500";
                let dot = "bg-slate-400";

                if (s === "中奖 · 待结算") {
                  bg = "bg-emerald-50";
                  border = "border-emerald-200";
                  text = "text-emerald-600";
                  dot = "bg-emerald-500";
                } else if (s === "中奖 · 待领取" || s === "已中奖") {
                  bg = "bg-cyan-50";
                  border = "border-cyan-200";
                  text = "text-cyan-600";
                  dot = "bg-cyan-500";
                } else if (s === "已领奖" || s === "已领取") {
                  bg = "bg-blue-50";
                  border = "border-blue-200";
                  text = "text-[#008cff]";
                  dot = "bg-[#008cff]";
                } else if (s === "待开奖") {
                  bg = "bg-purple-50";
                  border = "border-purple-200";
                  text = "text-purple-600";
                  dot = "bg-purple-500";
                } else if (s === "待结算") {
                  bg = "bg-amber-50";
                  border = "border-amber-200";
                  text = "text-amber-600";
                  dot = "bg-amber-500";
                } else if (s === "已取消") {
                  bg = "bg-rose-50";
                  border = "border-rose-200";
                  text = "text-rose-600";
                  dot = "bg-rose-500";
                } else if (s === "未中奖 · 待结算" || s === "未中奖" || s === "已退款") {
                  bg = "bg-slate-50";
                  border = "border-slate-200";
                  text = "text-slate-500";
                  dot = "bg-slate-400";
                }

                return (
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${bg} ${border}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    <span className={`text-[10.5px] font-medium whitespace-nowrap ${text}`}>
                      {s}
                    </span>
                  </div>
                );
              }
            },
            {
              key: "action",
              header: "操作",
              mobileOrder: 10,
              className: "text-right md:w-[100px]",
              headerClassName: "text-right",
              render: (order: BetOrderRecord) => {
                if (order.canRefund) {
                  return (
                    <button
                      onClick={async () => {
                        setProcessingId(`refund-${order.id}`);
                        try {
                          await onRefund?.(order.id);
                        } finally {
                          setProcessingId(null);
                        }
                      }}
                      disabled={processingId === `refund-${order.id}`}
                      className="px-3 py-1 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 border border-gray-300 text-[11px] font-medium rounded-full transition-colors inline-flex items-center justify-center gap-1 active:scale-95 w-full md:w-auto md:ml-auto cursor-pointer"
                      title="申请退款"
                    >
                      <RotateCcw className={`w-3 h-3 ${processingId === `refund-${order.id}` ? "animate-spin" : ""}`} />
                      <span>{processingId === `refund-${order.id}` ? "处理中..." : "申请退款"}</span>
                    </button>
                  );
                } else if (order.canClaim) {
                  return (
                    <button
                      onClick={async () => {
                        setProcessingId(`claim-${order.id}`);
                        try {
                          await onClaim?.(order.id);
                        } finally {
                          setProcessingId(null);
                        }
                      }}
                      disabled={processingId === `claim-${order.id}`}
                      className="px-3.5 py-1 bg-[#008cff] hover:bg-[#0070cc] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[11px] font-medium rounded-full transition-colors inline-flex items-center justify-center gap-1 active:scale-95 w-full md:w-auto md:ml-auto cursor-pointer min-w-[72px]"
                    >
                      {processingId === `claim-${order.id}` ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>领取中...</span>
                        </>
                      ) : (
                        "领取奖金"
                      )}
                    </button>
                  );
                } else if (order.isClaimed || order.status === "已领取" || order.status === "已领奖") {
                  return <span className="text-[#008cff] text-[11px] font-medium w-full block text-right">已领取</span>;
                } else if (order.isRefunded || order.status === "已退款") {
                  return <span className="text-[#a1a1aa] text-[11px] font-medium w-full block text-right">已退款</span>;
                } else {
                  return <span className="text-[#d4d4d8] w-full block text-right">—</span>;
                }
              }
            }
          ]}
          emptyText="暂无历史投注记录"
          rowClassName={(order: BetOrderRecord) => {
            const isWin = Boolean(order.isWin || order.status === "已中奖" || order.status === "中奖 · 待领取");
            return isWin ? "bg-[#008cff]/5" : "";
          }}
        />

        {/* Pagination */}
        {total > 0 && (
          <HistoryPagination
            totalCount={total}
            currentPage={page}
            totalPages={Math.ceil(total / pageSize)}
            onPrev={() => onPageChange?.(Math.max(1, page - 1))}
            onNext={() => onPageChange?.(Math.min(Math.ceil(total / pageSize), page + 1))}
          />
        )}
      </div>
    </div>
  );
}
