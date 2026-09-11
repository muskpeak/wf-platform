"use client";

import React from "react";
import { Trophy } from "lucide-react";

interface IssueStatusStripProps {
  issueNo?: string;
  issueNote?: string;
  ticketPrice?: string;
  ticketNote?: string;
  prizePool?: string;
  countdown?: string;
  countdownLabel?: string;
  countdownNote?: string;
  statusText?: string;
  progressPercent?: number;
  currency?: string;
}

export function IssueStatusStrip({
  issueNo = "2450 期",
  issueNote = "投注进行中",
  ticketPrice = "1 WUSD",
  ticketNote = "7位数号码",
  prizePool = "0.00",
  countdown = "0天 00:00:00",
  countdownLabel = "封盘倒计时",
  countdownNote = "周五 17:00 UTC",
  statusText = "投注中",
  progressPercent = 33.5,
  currency = "WUSD",
}: IssueStatusStripProps) {
  // Format issue number cleanly: "第 2450 期" for PC, "2450 期" for mobile
  const rawIssueNumber = issueNo.replace(/[^0-9]/g, "") || "2450";

  // 4 大核心色彩体系映射 (开售: 主题蓝 #008cff, 投注: #10B981, 封盘: #FACC15, 结算: #4F46E5)
  const getStatusTheme = (status: string) => {
    switch (status) {
      case "即将开售":
        return {
          badge: "bg-[#eff6ff] text-[#008cff] border border-[#bfdbfe]",
          dot: "bg-[#008cff]",
          countdownText: "text-[#008cff]",
          progressBar: "bg-gradient-to-r from-[#60a5fa] to-[#008cff]",
        };
      case "投注中":
        return {
          badge: "bg-[#ecfdf5] text-[#10B981] border border-[#a7f3d0]",
          dot: "bg-[#10B981]",
          countdownText: "text-[#10B981]",
          progressBar: "bg-gradient-to-r from-[#34d399] to-[#10B981]",
        };
      case "已封盘":
        return {
          badge: "bg-[#fefce8] text-[#ca8a04] border border-[#fde047]",
          dot: "bg-[#FACC15]",
          countdownText: "text-[#ca8a04]",
          progressBar: "bg-gradient-to-r from-[#fef08a] to-[#FACC15]",
        };
      case "断言确认中":
      case "等待开奖":
      case "已开奖":
      case "结算中":
        return {
          badge: "bg-[#eef2ff] text-[#4F46E5] border border-[#c7d2fe]",
          dot: "bg-[#4F46E5]",
          countdownText: "text-[#4F46E5]",
          progressBar: "bg-gradient-to-r from-[#818cf8] to-[#4F46E5]",
        };
      case "已取消":
      default:
        return {
          badge: "bg-gray-100 text-gray-500 border border-gray-200",
          dot: "bg-gray-400",
          countdownText: "text-gray-500",
          progressBar: "bg-gray-300",
        };
    }
  };

  const theme = getStatusTheme(statusText);

  return (
    <div className="bg-white rounded-[20px] border border-[#eaedf0] shadow-[0_2px_12px_rgba(0,0,0,0.02)] w-full overflow-hidden">
      {/* ======================================================== */}
      {/* 1. H5 移动端展示形态 (100% 1:1 对齐 Figma Node 1862:27526) */}
      {/* ======================================================== */}
      <div className="lg:hidden p-4 sm:p-5 flex flex-col">
        {/* 上层: 3 列指标 (期号 / 单注价格 / 当前奖池/USDT) */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1.2fr] items-center">
          {/* 第 1 列: 期号 */}
          <div className="flex flex-col">
            <span className="text-[11px] font-normal text-[#767676] leading-none">
              期号
            </span>
            <span className="text-[18px] sm:text-[20px] font-bold text-[#1a1a1a] leading-tight mt-1.5">
              {rawIssueNumber} 期
            </span>
          </div>

          {/* 细竖分割线 */}
          <div className="w-[1px] h-7 bg-[#eaedf0] mx-2" />

          {/* 第 2 列: 单注价格 */}
          <div className="flex flex-col">
            <span className="text-[11px] font-normal text-[#767676] leading-none">
              单注价格
            </span>
            <span className="text-[18px] sm:text-[20px] font-bold text-[#1a1a1a] leading-tight mt-1.5">
              {ticketPrice}
            </span>
          </div>

          {/* 细竖分割线 */}
          <div className="w-[1px] h-7 bg-[#eaedf0] mx-2" />

          {/* 第 3 列: 当前奖池/{currency} */}
          <div className="flex flex-col">
            <span className="text-[11px] font-normal text-[#767676] leading-none truncate">
              当前奖池/{currency}
            </span>
            <span className="text-[17px] sm:text-[19px] font-bold text-[#1a1a1a] font-mono leading-tight mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
              {prizePool}
            </span>
          </div>
        </div>

        {/* 下层: 倒计时 + 状态 + 动态主题色进度条 */}
        <div className="mt-5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className={`text-[15px] font-bold font-mono ${theme.countdownText}`}>
                {countdown}
              </span>
              <span className="text-[12px] text-[#767676] font-normal">
                {countdownLabel}
              </span>
            </div>

            {/* 状态胶囊 (带微动呼吸小圆点) */}
            <div className={`px-2.5 py-0.5 rounded-full flex items-center justify-center shadow-2xs ${theme.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${theme.dot} mr-1.5 animate-pulse`} />
              <span className="text-[11px] font-medium">
                {statusText}
              </span>
            </div>
          </div>

          {/* 动态主题色进度条 */}
          <div className="w-full h-1.5 bg-[#f0f2f5] rounded-full overflow-hidden">
            <div
              className={`h-full ${theme.progressBar} rounded-full transition-all duration-300`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PC 端展示形态 (100% 1:1 对齐 Figma Node 1910:33137)      */}
      {/* ======================================================== */}
      <div className="hidden lg:grid grid-cols-[1.1fr_auto_1.3fr_auto_1.1fr_auto_1.2fr] items-center px-6 py-4">
        {/* 第 1 列: 期号 */}
        <div className="flex flex-col justify-center">
          <span className="text-[12px] font-normal text-[#767676] leading-none">
            期号
          </span>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[18px] xl:text-[20px] font-bold text-[#1a1a1a] whitespace-nowrap">
              第 {rawIssueNumber} 期
            </span>
            <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap shadow-2xs ${theme.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${theme.dot} mr-1.5 animate-pulse`} />
              {statusText}
            </span>
          </div>
          <span className="text-[11px] text-[#999999] mt-0.5">
            {issueNote}
          </span>
        </div>

        {/* 竖分割线 */}
        <div className="w-[1px] h-9 bg-[#eaedf0] mx-4 xl:mx-6" />

        {/* 第 2 列: 倒计时 */}
        <div className="flex flex-col justify-center">
          <span className="text-[12px] font-normal text-[#767676] leading-none">
            {countdownLabel}
          </span>
          <div className="flex items-baseline gap-2.5 mt-1.5">
            <span className={`text-[18px] xl:text-[20px] font-bold font-mono whitespace-nowrap ${theme.countdownText}`}>
              {countdown}
            </span>
            <span className="text-[11px] text-[#999999] whitespace-nowrap">
              {countdownNote}
            </span>
          </div>
          {/* 动态主题色进度条 */}
          <div className="w-full h-1.5 bg-[#f0f2f5] rounded-full overflow-hidden mt-1.5">
            <div
              className={`h-full ${theme.progressBar} rounded-full transition-all duration-300`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 竖分割线 */}
        <div className="w-[1px] h-9 bg-[#eaedf0] mx-4 xl:mx-6" />

        {/* 第 3 列: 单注价格 */}
        <div className="flex flex-col justify-center">
          <span className="text-[12px] font-normal text-[#767676] leading-none">
            单注价格
          </span>
          <div className="text-[18px] xl:text-[20px] font-bold text-[#1a1a1a] mt-1.5 whitespace-nowrap">
            {ticketPrice}
          </div>
          <span className="text-[11px] text-[#999999] mt-0.5">
            {ticketNote}
          </span>
        </div>

        {/* 竖分割线 */}
        <div className="w-[1px] h-9 bg-[#eaedf0] mx-4 xl:mx-6" />

        {/* 第 4 列: 当前奖池 */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1 text-[12px] font-normal text-[#767676] leading-none">
            <Trophy className="w-3.5 h-3.5 text-[#767676]" />
            <span>当前奖池</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-[20px] xl:text-[22px] font-bold font-mono text-[#1a1a1a] tracking-tight whitespace-nowrap">
              {prizePool}
            </span>
            <span className="text-[11px] font-normal text-[#767676]">
              {currency}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

