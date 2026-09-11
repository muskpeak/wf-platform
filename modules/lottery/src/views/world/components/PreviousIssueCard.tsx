"use client";

import React from "react";

const PREVIOUS_DIGITS = [
  { country: "美国", flag: "🇺🇸", digit: 8, slot: "第1位" },
  { country: "中国", flag: "🇨🇳", digit: 1, slot: "第2位" },
  { country: "德国", flag: "🇩🇪", digit: 4, slot: "第3位" },
  { country: "日本", flag: "🇯🇵", digit: 5, slot: "第4位" },
  { country: "英国", flag: "🇬🇧", digit: 3, slot: "第5位" },
  { country: "法国", flag: "🇫🇷", digit: 7, slot: "第6位" },
  { country: "意大利", flag: "🇮🇹", digit: 9, slot: "第7位" },
];

export function PreviousIssueCard() {
  return (
    <div className="bg-white rounded-[22px] p-5 md:p-6 border border-[#eef3fa] shadow-sm flex flex-col gap-4">
      <div>
        <h4 className="text-[16px] font-bold text-[#0c0d10]">上期信息</h4>
        <p className="text-[10px] text-[#71717a] mt-0.5">
          上期中奖号码（第 2447 期）
        </p>
      </div>

      {/* 7 Digit Country Cards */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {PREVIOUS_DIGITS.map((item) => (
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

            {/* Digit */}
            <span className="font-mono font-bold text-[20px] sm:text-[24px] text-[#163300] leading-tight">
              {item.digit}
            </span>

            {/* Line divider */}
            <div className="w-[20px] h-px bg-[#dce2ec]" />

            <span className="text-[9px] text-[#9aa6b2]">
              {item.slot}
            </span>
          </div>
        ))}
      </div>

      {/* Previous Pool */}
      <div className="pt-3 border-t border-[#f3f4f8] flex flex-col gap-1">
        <span className="text-[12px] font-medium text-[#71717a]">
          上期奖池
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] sm:text-[36px] font-extrabold font-mono text-[#303030] tracking-tight">
            999784.8136
          </span>
          <span className="text-[14px] font-bold text-[#71717a] font-mono">
            USDT
          </span>
        </div>
      </div>
    </div>
  );
}
