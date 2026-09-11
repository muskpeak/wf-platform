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
  countdownNote = "周五 17:00 UTC",
  statusText = "投注中",
  progressPercent = 33.5,
  currency = "WUSD",
}: IssueStatusStripProps) {
  // Format issue number cleanly: "第 2450 期" for PC, "2450 期" for mobile
  const rawIssueNumber = issueNo.replace(/[^0-9]/g, "") || "2450";

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
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-normal text-[#767676] leading-none truncate">
              当前奖池/{currency}
            </span>
            <span className="text-[17px] sm:text-[19px] font-bold text-[#1a1a1a] font-mono leading-tight mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
              {prizePool}
            </span>
          </div>
        </div>

        {/* 下层: 封盘倒计时 + 投注中状态 + 蓝色进度条 (无横线，纯呼吸间隔) */}
        <div className="mt-5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-bold font-mono text-[#15803d]">
                {countdown}
              </span>
              <span className="text-[12px] text-[#767676] font-normal">
                封盘倒计时
              </span>
            </div>

            {/* 投注中 浅绿小胶囊 */}
            <div className="bg-[#dcfce7] px-3 py-0.5 rounded-full flex items-center justify-center">
              <span className="text-[12px] font-medium text-[#16a34a]">
                {statusText}
              </span>
            </div>
          </div>

          {/* 蓝色进度条 */}
          <div className="w-full h-1.5 bg-[#f0f2f5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#007aff] rounded-full transition-all duration-300"
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
            <span className="bg-[#dcfce7] text-[#16a34a] text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
              {statusText}
            </span>
          </div>
          <span className="text-[11px] text-[#999999] mt-0.5">
            {issueNote}
          </span>
        </div>

        {/* 竖分割线 */}
        <div className="w-[1px] h-9 bg-[#eaedf0] mx-4 xl:mx-6" />

        {/* 第 2 列: 封盘倒计时 */}
        <div className="flex flex-col justify-center">
          <span className="text-[12px] font-normal text-[#767676] leading-none">
            封盘倒计时
          </span>
          <div className="flex items-baseline gap-2.5 mt-1.5">
            <span className="text-[18px] xl:text-[20px] font-bold font-mono text-[#15803d] whitespace-nowrap">
              {countdown}
            </span>
            <span className="text-[11px] text-[#999999] whitespace-nowrap">
              {countdownNote}
            </span>
          </div>
          {/* 进度条 */}
          <div className="w-full h-1.5 bg-[#f0f2f5] rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-[#007aff] rounded-full transition-all duration-300"
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
